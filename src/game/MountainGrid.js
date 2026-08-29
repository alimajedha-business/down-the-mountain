// Symmetrical 5-4-5-4 Staggered Isometric Mountain Grid with Continuous Waterfall Streams
import * as THREE from 'three';
import { GAME_CONFIG, CUBE_TYPES, getTierForScore } from '../config.js';

// Reusable scratch vector to avoid per-call allocation
const _scratchVec3 = new THREE.Vector3();

export class MountainGrid {
  constructor(scene, voxelMeshes) {
    this.scene = scene;
    this.voxelMeshes = voxelMeshes;
    this.hazards = null;

    this.rows = new Map();
    this.cubeGroup = new THREE.Group();
    this.scene.add(this.cubeGroup);

    this.highestRowGenerated = -1;
    this.lowestRowRetained = 0;
    this.riverCooldown = 0;
    this.lastShieldRow = -Infinity; // Cooldown tracking for shield spawns

    // Performance: tracked sets for animated cubes
    this.animatedStars = new Set();  // cubes with spinning stars
    this.animatedShields = new Set(); // cubes with bobbing shields
    this.collapsingCubes = []; // data-driven collapse animations
  }

  setHazards(hazards) {
    this.hazards = hazards;
  }

  reset() {
    for (const cubes of this.rows.values()) {
      cubes.forEach(cube => {
        if (cube.mesh) {
          this.cubeGroup.remove(cube.mesh);
        }
      });
    }
    this.rows.clear();
    this.highestRowGenerated = -1;
    this.lowestRowRetained = 0;
    this.riverCooldown = 0;
    this.lastShieldRow = -Infinity;
    this.animatedStars.clear();
    this.animatedShields.clear();
    this.collapsingCubes.length = 0;

    for (let r = 0; r <= GAME_CONFIG.VISIBLE_ROWS_AHEAD; r++) {
      this.generateRow(r);
    }
  }

  getColsInRow(r) {
    return (r % 2 === 0) ? 5 : 4;
  }

  getWorldPosition(r, c) {
    const isOdd = r % 2 !== 0;
    const k = isOdd ? (c - 1.5) : (c - 2.0);
    const x = (r * 0.5 + k) * 1.0;
    const y = -r * GAME_CONFIG.BLOCK_SPACING_Y;
    const z = (r * 0.5 - k) * 1.0;
    return new THREE.Vector3(x, y, z);
  }

  // Scratch version for transient calculations (no allocation)
  getWorldPositionScratch(r, c) {
    const isOdd = r % 2 !== 0;
    const k = isOdd ? (c - 1.5) : (c - 2.0);
    _scratchVec3.set(
      (r * 0.5 + k) * 1.0,
      -r * GAME_CONFIG.BLOCK_SPACING_Y,
      (r * 0.5 - k) * 1.0
    );
    return _scratchVec3;
  }

  getLeftCell(r, c) {
    const isOdd = r % 2 !== 0;
    const nextCol = isOdd ? c : c - 1;
    return { r: r + 1, c: nextCol };
  }

  getRightCell(r, c) {
    const isOdd = r % 2 !== 0;
    const nextCol = isOdd ? c + 1 : c;
    return { r: r + 1, c: nextCol };
  }

  isCellValid(r, c) {
    const numCols = this.getColsInRow(r);
    return c >= 0 && c < numCols;
  }

  getCube(r, c) {
    const rowCubes = this.rows.get(r);
    if (!rowCubes || c < 0 || c >= rowCubes.length) return null;
    return rowCubes[c];
  }

  generateRow(r) {
    const cubesInRow = [];
    const numCols = this.getColsInRow(r);
    const isStartZone = r < 4;

    if (this.riverCooldown > 0) this.riverCooldown--;

    for (let c = 0; c < numCols; c++) {
      let type = CUBE_TYPES.SAFE;
      let customData = {};

      if (!isStartZone) {
        const pick = this.pickCubeType(r, c);
        type = pick.type;
        customData = pick.customData || {};
      }

      const mesh = this.voxelMeshes.createCube(type, customData);
      const pos = this.getWorldPosition(r, c);
      mesh.position.copy(pos);
      this.cubeGroup.add(mesh);

      const cubeData = {
        r,
        c,
        type,
        mesh,
        worldPos: pos,
        customData,
        collapsed: false,
        triggered: false,
        timer: 0,
        tntFuse: 0,
        spikesActive: false,
        starCollected: false
      };

      cubesInRow.push(cubeData);

      // Register animated cubes for efficient per-frame iteration
      if (type === CUBE_TYPES.STAR) {
        this.animatedStars.add(cubeData);
      } else if (type === CUBE_TYPES.SHIELD) {
        this.animatedShields.add(cubeData);
      }

      // Register trap cubes for efficient spike updates
      if (type === CUBE_TYPES.TRAP && this.hazards) {
        this.hazards.registerTrap(cubeData);
      }
    }

    this.ensureSolvability(r, cubesInRow);

    this.rows.set(r, cubesInRow);
    this.highestRowGenerated = Math.max(this.highestRowGenerated, r);
  }

  pickCubeType(r, c) {
    const tier = getTierForScore(r);
    const allowed = tier.allowedCubes;
    const canHaveRiver = allowed.includes(CUBE_TYPES.RIVER);

    let isRiverTarget = false;
    let continueRiver = null;

    if (canHaveRiver) {
      const aboveRow = this.rows.get(r - 1);
      if (aboveRow) {
        for (const parentCube of aboveRow) {
          if (!parentCube || parentCube.collapsed) continue;

          // Check if targeted by continuous River
          if (parentCube.type === CUBE_TYPES.RIVER && !isRiverTarget) {
            const parentExitDir = parentCube.customData.riverDir || 'left';
            const childCell = (parentExitDir === 'left')
              ? this.getLeftCell(r - 1, parentCube.c)
              : this.getRightCell(r - 1, parentCube.c);

            if (childCell.c === c) {
              isRiverTarget = true;
              const streamLength = parentCube.customData.streamLength || 1;
              // Balanced waterfall length: 2 to 4 cubes
              if (streamLength < 2 || (streamLength < 4 && Math.random() < 0.55)) {
                // Validate that the river exit from this cube won't go off-grid
                const nextExitDir = Math.random() < 0.5 ? 'left' : 'right';
                const nextCell = (nextExitDir === 'left')
                  ? this.getLeftCell(r, c)
                  : this.getRightCell(r, c);
                if (this.isCellValid(nextCell.r, nextCell.c)) {
                  continueRiver = {
                    type: CUBE_TYPES.RIVER,
                    customData: {
                      riverDir: nextExitDir,
                      streamLength: streamLength + 1
                    }
                  };
                } else {
                  this.riverCooldown = 3;
                }
              } else {
                this.riverCooldown = 3;
              }
            }
          }
        }
      }
    }

    if (continueRiver) return continueRiver;

    // Shield cooldown gap (15-20 rows depending on tier)
    const minShieldGap = (tier.id >= 4) ? 15 : 20;
    const canShield = !isRiverTarget && (r - this.lastShieldRow) >= minShieldGap;

    const rand = Math.random();

    // --- TIER 1: Score 0-20 (SAFE, DIRT, TREE, STAR, SHIELD only) ---
    if (tier.id === 1) {
      if (canShield && rand < 0.008) {
        this.lastShieldRow = r;
        return { type: CUBE_TYPES.SHIELD };
      } else if (rand < 0.038) {
        return { type: CUBE_TYPES.STAR };
      } else if (rand < 0.14) {
        return { type: CUBE_TYPES.TREE };
      } else if (rand < 0.36) {
        return { type: CUBE_TYPES.DIRT };
      } else {
        return { type: CUBE_TYPES.SAFE };
      }
    }

    // --- TIER 2: Score 21-40 (Adds RIVER and TNT) ---
    if (tier.id === 2) {
      if (canShield && rand < 0.008) {
        this.lastShieldRow = r;
        return { type: CUBE_TYPES.SHIELD };
      } else if (rand < 0.038) {
        return { type: CUBE_TYPES.STAR };
      } else if (rand < 0.14 && !isRiverTarget && this.riverCooldown <= 0) {
        const riverDir = Math.random() < 0.5 ? 'left' : 'right';
        const exitCell = (riverDir === 'left') ? this.getLeftCell(r, c) : this.getRightCell(r, c);
        if (this.isCellValid(exitCell.r, exitCell.c)) {
          this.riverCooldown = 3;
          return { type: CUBE_TYPES.RIVER, customData: { riverDir, streamLength: 1 } };
        }
        return { type: CUBE_TYPES.SAFE };
      } else if (rand < 0.24) {
        return { type: CUBE_TYPES.TNT };
      } else if (rand < 0.36 && !isRiverTarget) {
        return { type: CUBE_TYPES.TREE };
      } else if (rand < 0.54) {
        return { type: CUBE_TYPES.DIRT };
      } else {
        return { type: CUBE_TYPES.SAFE };
      }
    }

    // --- TIER 3: Score 41-70 (Adds TRAP and CRACKED, Bear active in BearChaser) ---
    if (tier.id === 3) {
      if (canShield && rand < 0.010) {
        this.lastShieldRow = r;
        return { type: CUBE_TYPES.SHIELD };
      } else if (rand < 0.040) {
        return { type: CUBE_TYPES.STAR };
      } else if (rand < 0.16) {
        return { type: CUBE_TYPES.TRAP };
      } else if (rand < 0.27) {
        return { type: CUBE_TYPES.TNT };
      } else if (rand < 0.36) {
        return { type: CUBE_TYPES.CRACKED };
      } else if (rand < 0.46 && !isRiverTarget && this.riverCooldown <= 0) {
        const riverDir = Math.random() < 0.5 ? 'left' : 'right';
        const exitCell = (riverDir === 'left') ? this.getLeftCell(r, c) : this.getRightCell(r, c);
        if (this.isCellValid(exitCell.r, exitCell.c)) {
          this.riverCooldown = 3;
          return { type: CUBE_TYPES.RIVER, customData: { riverDir, streamLength: 1 } };
        }
        return { type: CUBE_TYPES.SAFE };
      } else if (rand < 0.57 && !isRiverTarget) {
        return { type: CUBE_TYPES.TREE };
      } else if (rand < 0.67) {
        return { type: CUBE_TYPES.DIRT };
      } else {
        return { type: CUBE_TYPES.SAFE };
      }
    }

    // --- TIER 4: Score 71+ (Adds MAGMA and scales difficulty with depth) ---
    const isDeep = r > 100;
    const magmaWeight = isDeep ? 0.14 : 0.11;
    const trapWeight = isDeep ? 0.13 : 0.11;
    const tntWeight = isDeep ? 0.12 : 0.10;
    const crackedWeight = isDeep ? 0.10 : 0.08;
    const riverWeight = 0.09;
    const treeWeight = 0.10;
    const dirtWeight = isDeep ? 0.06 : 0.08;

    if (canShield && rand < (isDeep ? 0.015 : 0.012)) {
      this.lastShieldRow = r;
      return { type: CUBE_TYPES.SHIELD };
    } else if (rand < 0.040) {
      return { type: CUBE_TYPES.STAR };
    }

    let p = 0.04;
    p += magmaWeight;
    if (rand < p) return { type: CUBE_TYPES.MAGMA };

    p += trapWeight;
    if (rand < p) return { type: CUBE_TYPES.TRAP };

    p += tntWeight;
    if (rand < p) return { type: CUBE_TYPES.TNT };

    p += crackedWeight;
    if (rand < p) return { type: CUBE_TYPES.CRACKED };

    p += riverWeight;
    if (rand < p && !isRiverTarget && this.riverCooldown <= 0) {
      const riverDir = Math.random() < 0.5 ? 'left' : 'right';
      const exitCell = (riverDir === 'left') ? this.getLeftCell(r, c) : this.getRightCell(r, c);
      if (this.isCellValid(exitCell.r, exitCell.c)) {
        this.riverCooldown = 3;
        return { type: CUBE_TYPES.RIVER, customData: { riverDir, streamLength: 1 } };
      }
      return { type: CUBE_TYPES.SAFE };
    }

    p += treeWeight;
    if (rand < p && !isRiverTarget) return { type: CUBE_TYPES.TREE };

    p += dirtWeight;
    if (rand < p) return { type: CUBE_TYPES.DIRT };

    return { type: CUBE_TYPES.SAFE };
  }

  ensureSolvability(r, cubesInRow) {
    const numCols = cubesInRow.length;
    const aboveRow = this.rows.get(r - 1);

    const isFatalOrBlocked = (type) => type === CUBE_TYPES.TREE || type === CUBE_TYPES.MAGMA;
    const isHazard = (type) =>
      type === CUBE_TYPES.MAGMA || type === CUBE_TYPES.TNT ||
      type === CUBE_TYPES.TRAP || type === CUBE_TYPES.CRACKED;

    // Rule 0: Cap hazard density — ensure at least 2 cubes are safe-traversable
    const maxHazards = numCols - 2;
    let hazardCount = 0;
    for (let c = 0; c < numCols; c++) {
      if (isHazard(cubesInRow[c].type) || isFatalOrBlocked(cubesInRow[c].type)) {
        hazardCount++;
        if (hazardCount > maxHazards) {
          this.retypeCube(cubesInRow[c], CUBE_TYPES.SAFE);
        }
      }
    }

    // Rule 1: Never allow a River exit destination to be a Tree or Magma
    if (aboveRow) {
      aboveRow.forEach(pCube => {
        if (pCube && pCube.type === CUBE_TYPES.RIVER) {
          const dir = pCube.customData.riverDir || 'left';
          const child = (dir === 'left') ? this.getLeftCell(r - 1, pCube.c) : this.getRightCell(r - 1, pCube.c);
          if (child.c >= 0 && child.c < numCols) {
            const destCube = cubesInRow[child.c];
            if (destCube && isFatalOrBlocked(destCube.type)) {
              this.retypeCube(destCube, CUBE_TYPES.SAFE);
            }
          }
        }
      });
    }

    // Rule 2: Limit Tree density and no adjacent trees
    let treeCount = 0;
    const maxTrees = (numCols === 4) ? 1 : 2;
    for (let c = 0; c < numCols; c++) {
      if (cubesInRow[c].type === CUBE_TYPES.TREE) {
        if (c > 0 && cubesInRow[c - 1].type === CUBE_TYPES.TREE) {
          this.retypeCube(cubesInRow[c], CUBE_TYPES.SAFE);
          continue;
        }
        treeCount++;
        if (treeCount > maxTrees) {
          this.retypeCube(cubesInRow[c], CUBE_TYPES.SAFE);
        }
      }
    }

    // Rule 3: Guarantee every passable parent in row r-1 has at least one passable descendant in row r
    if (aboveRow) {
      aboveRow.forEach(pCube => {
        if (pCube && !isFatalOrBlocked(pCube.type)) {
          const leftChild = this.getLeftCell(r - 1, pCube.c);
          const rightChild = this.getRightCell(r - 1, pCube.c);

          const leftValid = leftChild.c >= 0 && leftChild.c < numCols;
          const rightValid = rightChild.c >= 0 && rightChild.c < numCols;

          const leftPassable = leftValid && !isFatalOrBlocked(cubesInRow[leftChild.c].type);
          const rightPassable = rightValid && !isFatalOrBlocked(cubesInRow[rightChild.c].type);

          // If both exits from this parent are blocked by Tree or Magma, unblock one
          if (!leftPassable && !rightPassable) {
            if (leftValid && rightValid) {
              const mid = numCols / 2;
              const chosen = Math.abs(leftChild.c - mid) <= Math.abs(rightChild.c - mid) ? leftChild.c : rightChild.c;
              this.retypeCube(cubesInRow[chosen], CUBE_TYPES.SAFE);
            } else if (leftValid) {
              this.retypeCube(cubesInRow[leftChild.c], CUBE_TYPES.SAFE);
            } else if (rightValid) {
              this.retypeCube(cubesInRow[rightChild.c], CUBE_TYPES.SAFE);
            }
          }
        }
      });
    }

    // Rule 4: Reachability check from top of mountain (guarantee continuous viable paths)
    const reachableFromAbove = new Set();
    if (r === 0) {
      reachableFromAbove.add(Math.floor(numCols / 2));
    } else if (aboveRow) {
      const prevReachable = aboveRow.filter(c => !isFatalOrBlocked(c.type)).map(c => c.c);
      prevReachable.forEach(pCol => {
        const leftChild = this.getLeftCell(r - 1, pCol);
        const rightChild = this.getRightCell(r - 1, pCol);
        if (leftChild.c >= 0 && leftChild.c < numCols && !isFatalOrBlocked(cubesInRow[leftChild.c].type)) {
          reachableFromAbove.add(leftChild.c);
        }
        if (rightChild.c >= 0 && rightChild.c < numCols && !isFatalOrBlocked(cubesInRow[rightChild.c].type)) {
          reachableFromAbove.add(rightChild.c);
        }
      });
    }

    if (reachableFromAbove.size < 2) {
      const mid = Math.floor(numCols / 2);
      this.retypeCube(cubesInRow[mid], CUBE_TYPES.SAFE);
      if (mid > 0) this.retypeCube(cubesInRow[mid - 1], CUBE_TYPES.SAFE);
      if (mid + 1 < numCols) this.retypeCube(cubesInRow[mid + 1], CUBE_TYPES.SAFE);
    }
  }

  retypeCube(cubeData, newType, customData = {}) {
    if (!cubeData) return;

    // Unregister from tracking sets if changing type
    this.animatedStars.delete(cubeData);
    this.animatedShields.delete(cubeData);
    if (this.hazards) this.hazards.unregisterTrap(cubeData);

    if (cubeData.mesh) {
      this.cubeGroup.remove(cubeData.mesh);
    }
    cubeData.type = newType;
    cubeData.customData = customData;
    cubeData.mesh = this.voxelMeshes.createCube(newType, customData);
    cubeData.mesh.position.copy(cubeData.worldPos);
    this.cubeGroup.add(cubeData.mesh);

    // Re-register if new type is animated or tracked
    if (newType === CUBE_TYPES.STAR) {
      this.animatedStars.add(cubeData);
    } else if (newType === CUBE_TYPES.SHIELD) {
      this.animatedShields.add(cubeData);
    }
    if (newType === CUBE_TYPES.TRAP && this.hazards) {
      this.hazards.registerTrap(cubeData);
    }
  }

  update(playerRow) {
    const targetMaxRow = playerRow + GAME_CONFIG.VISIBLE_ROWS_AHEAD;
    while (this.highestRowGenerated < targetMaxRow) {
      this.generateRow(this.highestRowGenerated + 1);
    }

    const minKeepRow = Math.max(0, playerRow - GAME_CONFIG.VISIBLE_ROWS_BEHIND);
    if (minKeepRow > this.lowestRowRetained + 5) {
      for (let r = this.lowestRowRetained; r < minKeepRow; r++) {
        const rowCubes = this.rows.get(r);
        if (rowCubes) {
          rowCubes.forEach(cube => {
            if (cube.mesh) {
              this.cubeGroup.remove(cube.mesh);
            }
            // Clean up from tracking sets
            this.animatedStars.delete(cube);
            this.animatedShields.delete(cube);
            if (this.hazards) this.hazards.unregisterTrap(cube);
          });
          this.rows.delete(r);
        }
      }
      this.lowestRowRetained = minKeepRow;
    }
  }

  updateAnimations(delta) {
    const time = performance.now() * 0.003;

    // Only iterate tracked animated stars (not all cubes)
    for (const cube of this.animatedStars) {
      if (cube.collapsed || !cube.mesh || cube.starCollected) {
        this.animatedStars.delete(cube);
        continue;
      }
      if (cube.mesh.userData.starMesh) {
        cube.mesh.userData.starMesh.rotation.y += delta * 3.0;
        cube.mesh.userData.starMesh.position.y = 1.05 + Math.sin(time * 3 + cube.r + cube.c) * 0.08;
      }
    }

    // Only iterate tracked animated shields (not all cubes)
    for (const cube of this.animatedShields) {
      if (cube.collapsed || !cube.mesh || cube.triggered) {
        this.animatedShields.delete(cube);
        continue;
      }
      if (cube.mesh.userData.pickupMesh) {
        cube.mesh.userData.pickupMesh.position.y = 1.0 + Math.sin(time * 3 + cube.r) * 0.1;
        cube.mesh.userData.pickupMesh.rotation.y += delta * 2.0;
      }
    }

    // Data-driven collapse animations (replaces per-cube rAF loops)
    for (let i = this.collapsingCubes.length - 1; i >= 0; i--) {
      const anim = this.collapsingCubes[i];
      anim.elapsed += delta;

      if (anim.elapsed < 0.75) {
        const t = anim.elapsed;
        anim.mesh.position.y = anim.startY - t * t * 28.0;
        anim.mesh.position.x = anim.startX + anim.rotDirX * t * 0.3;
        anim.mesh.position.z = anim.startZ + anim.rotDirZ * t * 0.3;
        anim.mesh.rotation.x += anim.rotDirX * 0.04;
        anim.mesh.rotation.z += anim.rotDirZ * 0.04;
        const s = Math.max(0, 1.0 - (t / 0.75) * 0.7);
        anim.mesh.scale.set(s, s, s);
      } else {
        this.cubeGroup.remove(anim.mesh);
        this.collapsingCubes.splice(i, 1);
      }
    }
  }

  collapseCube(cubeData) {
    if (!cubeData || cubeData.collapsed) return;
    cubeData.collapsed = true;

    // Clean up from animated sets
    this.animatedStars.delete(cubeData);
    this.animatedShields.delete(cubeData);

    if (cubeData.mesh) {
      // Queue data-driven animation instead of spawning rAF loop
      this.collapsingCubes.push({
        mesh: cubeData.mesh,
        startY: cubeData.mesh.position.y,
        startX: cubeData.mesh.position.x,
        startZ: cubeData.mesh.position.z,
        rotDirX: (Math.random() - 0.5) * 4.0,
        rotDirZ: (Math.random() - 0.5) * 4.0,
        elapsed: 0
      });
    }
  }
}
