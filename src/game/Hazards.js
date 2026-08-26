// Hazard Mechanics: Spike Trap 1s Cycles, TNT 3s/1s Domino Chains, and Cracked Blocks
import { GAME_CONFIG, CUBE_TYPES } from '../config.js';

export class Hazards {
  constructor(grid, voxelMeshes, particles, audio) {
    this.grid = grid;
    this.voxelMeshes = voxelMeshes;
    this.particles = particles;
    this.audio = audio;

    this.activeTNTs = new Set();
    this.activeCracked = new Set();
    this.trapCubes = new Set(); // Performance: tracked set for spike traps
  }

  reset() {
    this.activeTNTs.clear();
    this.activeCracked.clear();
    this.trapCubes.clear();
  }

  // Register a trap cube for efficient spike updates
  registerTrap(cubeData) {
    if (cubeData && cubeData.type === CUBE_TYPES.TRAP) {
      this.trapCubes.add(cubeData);
    }
  }

  // Unregister trap cubes (called when rows are cleaned up)
  unregisterTrap(cubeData) {
    this.trapCubes.delete(cubeData);
  }

  // Trigger TNT: first stepped-on TNT gets 2.0s fuse; adjacent domino TNTs get 1.0s fuse
  triggerTNT(cubeData, isChained = false) {
    if (!cubeData || cubeData.collapsed) return;

    if (!cubeData.triggered) {
      cubeData.triggered = true;
      cubeData.tntFuse = isChained ? GAME_CONFIG.TNT_CHAIN_FUSE : GAME_CONFIG.TNT_INITIAL_FUSE;

      if (cubeData.mesh && cubeData.mesh.userData.sparkMesh) {
        cubeData.mesh.userData.sparkMesh.visible = true;
      }

      this.audio.playFuseBurn();
      this.activeTNTs.add(cubeData);
    } else if (isChained) {
      // If already active with longer timer, expedite to chain fuse (1.0s)
      cubeData.tntFuse = Math.min(cubeData.tntFuse, GAME_CONFIG.TNT_CHAIN_FUSE);
    }
  }

  triggerCrackedCube(cubeData, onCollapseCallback) {
    if (!cubeData || cubeData.triggered || cubeData.collapsed) return;

    cubeData.triggered = true;
    cubeData.timer = GAME_CONFIG.CRACKED_COLLAPSE_DELAY; // 2.0s
    cubeData.onCollapse = onCollapseCallback;

    this.audio.playCracking();
    this.activeCracked.add(cubeData);
  }

  update(delta, playerPos, isShielded, onExplosionRadiusCheck) {
    this.updateSpikes();
    this.updateTNT(delta, onExplosionRadiusCheck);
    this.updateCracked(delta);
  }

  // Spike Traps: 2.0s Hidden (safe) <-> 1.0s Visible (fatal)
  // Performance: Only iterates registered trap cubes, not all grid cubes
  updateSpikes() {
    const timeSec = performance.now() / 1000;
    const cycleTime = timeSec % GAME_CONFIG.SPIKE_CYCLE_PERIOD;
    const isActive = cycleTime < GAME_CONFIG.SPIKE_ACTIVE_TIME;

    for (const cube of this.trapCubes) {
      if (cube.collapsed || !cube.mesh) {
        this.trapCubes.delete(cube);
        continue;
      }

      cube.spikesActive = isActive;
      const spikeMesh = cube.mesh.userData.spikeMesh;
      if (spikeMesh) {
        const targetY = isActive ? 0.75 : 0.15;
        spikeMesh.position.y += (targetY - spikeMesh.position.y) * 0.35;
      }
    }
  }

  // Update TNT Fuses and trigger Domino Chain Explosions
  updateTNT(delta, onExplosionRadiusCheck) {
    const toExplode = [];

    for (const cube of this.activeTNTs) {
      if (cube.collapsed) {
        this.activeTNTs.delete(cube);
        continue;
      }

      cube.tntFuse -= delta;

      // Active vibration demonstrating activation: block shakes and flashes
      if (cube.mesh && cube.mesh.userData.mesh) {
        const isFlash = Math.floor(performance.now() / 100) % 2 === 0;
        const innerMesh = cube.mesh.userData.mesh;

        if (isFlash) {
          innerMesh.material = [
            this.voxelMeshes.materials.tntFlashingSide,
            this.voxelMeshes.materials.tntFlashingSide,
            this.voxelMeshes.materials.tntFlashingTop,
            this.voxelMeshes.materials.tntFlashingTop,
            this.voxelMeshes.materials.tntFlashingSide,
            this.voxelMeshes.materials.tntFlashingSide
          ];
        } else if (cube.mesh.userData.normalMaterials) {
          innerMesh.material = cube.mesh.userData.normalMaterials;
        }

        const spark = cube.mesh.userData.sparkMesh;
        if (spark) {
          spark.visible = true;
          spark.position.y = 0.65 + Math.sin(performance.now() * 0.04) * 0.1;
        }

        // Distinct vibration tremor from activation until detonation
        const shakeMag = (cube.tntFuse < 0.8) ? 0.12 : 0.07;
        cube.mesh.position.x = cube.worldPos.x + (Math.random() - 0.5) * shakeMag;
        cube.mesh.position.z = cube.worldPos.z + (Math.random() - 0.5) * shakeMag;
      }

      if (cube.tntFuse <= 0) {
        toExplode.push(cube);
      }
    }

    for (const cube of toExplode) {
      this.activeTNTs.delete(cube);
      this.explodeTNT(cube, onExplosionRadiusCheck);
    }
  }

  explodeTNT(cube, onExplosionRadiusCheck) {
    if (cube.collapsed) return;

    this.audio.playExplosion();
    this.particles.spawnExplosion(cube.worldPos);
    this.grid.collapseCube(cube);

    if (onExplosionRadiusCheck) {
      onExplosionRadiusCheck(cube.r, cube.c);
    }

    // Domino Chain Reaction: find all adjacent TNT cubes in 5-4-5-4 diamond grid
    const isOdd = cube.r % 2 !== 0;
    const adjacentCoords = [
      this.grid.getLeftCell(cube.r, cube.c),
      this.grid.getRightCell(cube.r, cube.c),
      { r: cube.r, c: cube.c - 1 },
      { r: cube.r, c: cube.c + 1 },
      { r: cube.r - 1, c: isOdd ? cube.c : cube.c - 1 },
      { r: cube.r - 1, c: isOdd ? cube.c + 1 : cube.c }
    ];

    // Trigger all adjacent non-collapsed TNT cubes with 1.0s domino fuse
    for (const coord of adjacentCoords) {
      const neighbor = this.grid.getCube(coord.r, coord.c);
      if (neighbor && neighbor.type === CUBE_TYPES.TNT && !neighbor.collapsed) {
        this.triggerTNT(neighbor, true);
      }
    }
    // Removed: brute-force world proximity scan over all grid rows.
    // The explicit 6-neighbor adjacency check above already covers all
    // geometrically adjacent cells in the diamond grid.
  }

  // Update Cracked Earth Fault Cubes: 2s vibration tremor, then collapse off mountain
  updateCracked(delta) {
    const toCollapse = [];

    for (const cube of this.activeCracked) {
      if (cube.collapsed) {
        this.activeCracked.delete(cube);
        continue;
      }

      cube.timer -= delta;

      // Noticeable seismic vibration tremor while active
      if (cube.mesh) {
        const tremorMag = (cube.timer < 0.8) ? 0.09 : 0.05;
        cube.mesh.position.x = cube.worldPos.x + (Math.random() - 0.5) * tremorMag;
        cube.mesh.position.z = cube.worldPos.z + (Math.random() - 0.5) * tremorMag;
      }

      // Small crumbling dust particles during tremor
      if (Math.random() < 0.12) {
        this.particles.spawnCrumblyDebris(cube.worldPos);
      }

      if (cube.timer <= 0) {
        toCollapse.push(cube);
      }
    }

    for (const cube of toCollapse) {
      this.activeCracked.delete(cube);
      this.grid.collapseCube(cube);
      this.particles.spawnCrumblyDebris(cube.worldPos);
      this.audio.playBlockBreak();

      if (cube.onCollapse) {
        cube.onCollapse(cube.r, cube.c);
      }
    }
  }
}
