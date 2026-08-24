// Symmetrical 5-4-5-4 Staggered Isometric Mountain Grid with Continuous Waterfall Streams
import * as THREE from 'three';
import { GAME_CONFIG, CUBE_TYPES } from '../config.js';

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
    }

    this.ensureSolvability(r, cubesInRow);

    this.rows.set(r, cubesInRow);
    this.highestRowGenerated = Math.max(this.highestRowGenerated, r);
  }

  pickCubeType(r, c) {
    let isRiverTarget = false;
    let continueRiver = null;

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
              const nextExitDir = Math.random() < 0.5 ? 'left' : 'right';
              continueRiver = {
                type: CUBE_TYPES.RIVER,
                customData: {
                  riverDir: nextExitDir,
                  streamLength: streamLength + 1
                }
              };
            } else {
              // River ended -> short cooldown between waterfalls
              this.riverCooldown = 3;
            }
          }
        }
      }
    }

    if (continueRiver) return continueRiver;

    const rand = Math.random();

    if (rand < 0.30) {
      return { type: CUBE_TYPES.SAFE };
    } else if (rand < 0.44) {
      return { type: CUBE_TYPES.DIRT };
    } else if (rand < 0.54) {
      // 10% Volcanic Magma Cubes
      return { type: CUBE_TYPES.MAGMA };
    } else if (rand < 0.64) {
      return { type: CUBE_TYPES.TRAP };
    } else if (rand < 0.74) {
      return { type: CUBE_TYPES.TNT };
    } else if (rand < 0.83) {
      return { type: CUBE_TYPES.CRACKED };
    } else if (rand < 0.90 && !isRiverTarget && this.riverCooldown <= 0) {
      // Start a waterfall stream (stepping down)
      const riverDir = Math.random() < 0.5 ? 'left' : 'right';
      this.riverCooldown = 3; // Gap between waterfalls
      return {
        type: CUBE_TYPES.RIVER,
        customData: {
          riverDir,
          streamLength: 1
        }
      };
    } else if (rand < 0.95 && !isRiverTarget) {
      return { type: CUBE_TYPES.TREE };
    } else if (rand < 0.98) {
      return { type: CUBE_TYPES.STAR };
    } else {
      return { type: isRiverTarget ? CUBE_TYPES.SAFE : CUBE_TYPES.SHIELD };
    }
  }

  ensureSolvability(r, cubesInRow) {
    const numCols = cubesInRow.length;
    const aboveRow = this.rows.get(r - 1);

    const isFatalOrBlocked = (type) => type === CUBE_TYPES.TREE || type === CUBE_TYPES.MAGMA;

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
    if (cubeData.mesh) {
      this.cubeGroup.remove(cubeData.mesh);
    }
    cubeData.type = newType;
    cubeData.customData = customData;
    cubeData.mesh = this.voxelMeshes.createCube(newType, customData);
    cubeData.mesh.position.copy(cubeData.worldPos);
    this.cubeGroup.add(cubeData.mesh);
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
          });
          this.rows.delete(r);
        }
      }
      this.lowestRowRetained = minKeepRow;
    }
  }

  updateAnimations(delta) {
    const time = performance.now() * 0.003;

    for (const cubes of this.rows.values()) {
      for (const cube of cubes) {
        if (cube.collapsed || !cube.mesh) continue;

        // 1. Spinning Stars
        if (cube.type === CUBE_TYPES.STAR && cube.mesh.userData.starMesh && !cube.starCollected) {
          cube.mesh.userData.starMesh.rotation.y += delta * 3.0;
          cube.mesh.userData.starMesh.position.y = 1.05 + Math.sin(time * 3 + cube.r + cube.c) * 0.08;
        }

        // 2. Shield Bubble Bobbing
        if (cube.type === CUBE_TYPES.SHIELD && cube.mesh.userData.pickupMesh && !cube.triggered) {
          cube.mesh.userData.pickupMesh.position.y = 1.0 + Math.sin(time * 3 + cube.r) * 0.1;
          cube.mesh.userData.pickupMesh.rotation.y += delta * 2.0;
        }
      }
    }
  }

  collapseCube(cubeData) {
    if (!cubeData || cubeData.collapsed) return;
    cubeData.collapsed = true;
    if (cubeData.mesh) {
      const mesh = cubeData.mesh;
      const startY = mesh.position.y;
      const startX = mesh.position.x;
      const startZ = mesh.position.z;
      const rotDirX = (Math.random() - 0.5) * 4.0;
      const rotDirZ = (Math.random() - 0.5) * 4.0;
      const startTime = performance.now();

      const dropAnim = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        if (elapsed < 0.75) {
          mesh.position.y = startY - elapsed * elapsed * 28.0;
          mesh.position.x = startX + rotDirX * elapsed * 0.3;
          mesh.position.z = startZ + rotDirZ * elapsed * 0.3;
          mesh.rotation.x += rotDirX * 0.04;
          mesh.rotation.z += rotDirZ * 0.04;
          const s = Math.max(0, 1.0 - (elapsed / 0.75) * 0.7);
          mesh.scale.set(s, s, s);
          requestAnimationFrame(dropAnim);
        } else {
          this.cubeGroup.remove(mesh);
        }
      };
      dropAnim();
    }
  }
}
