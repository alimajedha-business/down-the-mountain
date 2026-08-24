// Cubic Bear Roamer Entity: High Frequency Spawns (~12-18s), Guaranteed Safe Circular Patrol (4 Cubes), and Player Defeat
import * as THREE from 'three';
import { GAME_CONFIG, CUBE_TYPES } from '../config.js';
import { BearMesh } from '../graphics/BearMesh.js';

export class BearChaser {
  constructor(scene, grid, player, hazards, particles, audio) {
    this.scene = scene;
    this.grid = grid;
    this.player = player;
    this.hazards = hazards;
    this.particles = particles;
    this.audio = audio;

    this.bearMesh = new BearMesh();
    this.scene.add(this.bearMesh.root);
    this.bearMesh.root.visible = false;

    this.state = 'INACTIVE'; // 'INACTIVE', 'ROAMING', 'FALLING', 'DEAD'
    this.gridPos = { r: 0, c: 0 };
    this.patrolLoop = []; // Array of { r, c } forming a closed circular loop
    this.currentWaypointIdx = 0;
    this.nextWaypointIdx = 0;
    this.roamStepsRemaining = 0;
    this.spawnCooldown = 0.5; // Fast initial spawn (appears as soon as player reaches row 3+)

    this.isMoving = false;
    this.hopProgress = 0;
    this.hopDuration = 0.48; // Steady linear hop speed
    this.hopPauseTimer = 0;
    this.hopPauseDuration = 0.14;

    this.hopStartPos = new THREE.Vector3();
    this.hopEndPos = new THREE.Vector3();
    this.targetRotY = 0;
  }

  reset() {
    this.state = 'INACTIVE';
    this.bearMesh.root.visible = false;
    this.isMoving = false;
    this.patrolLoop = [];
    this.currentWaypointIdx = 0;
    this.nextWaypointIdx = 0;
    this.roamStepsRemaining = 0;
    this.spawnCooldown = 0.5; // Fast initial spawn upon starting game
  }

  // Find or guarantee a closed circular loop of 4 adjacent safe cubes on the mountain grid
  findSafeCircularLoop(minRow, maxRow) {
    const isSafeCube = (r, c) => {
      if (!this.grid.isCellValid(r, c)) return false;
      const cube = this.grid.getCube(r, c);
      if (!cube || cube.collapsed) return false;
      // Must be completely safe: No trees, magma, traps, cracked earth, TNT, or rivers
      const safeTypes = [CUBE_TYPES.SAFE, CUBE_TYPES.DIRT, CUBE_TYPES.STAR, CUBE_TYPES.SHIELD];
      return safeTypes.includes(cube.type);
    };

    // Pass 1: Look for a naturally completely safe 4-cube loop
    for (let r = minRow; r <= maxRow; r++) {
      const numCols = this.grid.getColsInRow(r);

      for (let c = 0; c < numCols; c++) {
        const top = { r, c };
        const right = this.grid.getRightCell(r, c);
        const bottom = this.grid.getLeftCell(right.r, right.c);
        const left = this.grid.getLeftCell(r, c);

        const candidateLoop = [top, right, bottom, left];

        if (!candidateLoop.every(pt => this.grid.isCellValid(pt.r, pt.c))) continue;
        if (candidateLoop.every(pt => isSafeCube(pt.r, pt.c))) {
          return candidateLoop;
        }
      }
    }

    // Pass 2 (Fallback): Pick any valid 4-cube diamond loop in range and sanitize its cubes to SAFE
    for (let r = minRow; r <= maxRow; r++) {
      const numCols = this.grid.getColsInRow(r);

      for (let c = 0; c < numCols; c++) {
        const top = { r, c };
        const right = this.grid.getRightCell(r, c);
        const bottom = this.grid.getLeftCell(right.r, right.c);
        const left = this.grid.getLeftCell(r, c);

        const candidateLoop = [top, right, bottom, left];

        if (candidateLoop.every(pt => this.grid.isCellValid(pt.r, pt.c))) {
          // Sanitize candidate loop cubes to SAFE so bear has guaranteed safe territory
          candidateLoop.forEach(pt => {
            const cube = this.grid.getCube(pt.r, pt.c);
            if (cube && (cube.type === CUBE_TYPES.TREE || cube.type === CUBE_TYPES.MAGMA || cube.type === CUBE_TYPES.TRAP || cube.type === CUBE_TYPES.CRACKED || cube.type === CUBE_TYPES.TNT || cube.type === CUBE_TYPES.RIVER)) {
              this.grid.retypeCube(cube, CUBE_TYPES.SAFE);
            }
          });
          return candidateLoop;
        }
      }
    }

    return null;
  }

  // Attempt to spawn the bear on a safe circular roaming loop ahead of the player
  trySpawn() {
    if (this.state !== 'INACTIVE') return;
    if (!this.player || this.player.isDead) return;
    if (this.player.gridPos.r < 3) return; // Starts as soon as player reaches row 3
    if (this.spawnCooldown > 0) return;

    // Search for a safe 4-cube circular loop ahead of the player
    const minR = Math.max(1, this.player.gridPos.r + 2);
    const maxR = this.player.gridPos.r + 16;
    const loop = this.findSafeCircularLoop(minR, maxR);

    if (!loop) {
      this.spawnCooldown = 2.0;
      return;
    }

    this.patrolLoop = loop;
    this.currentWaypointIdx = 0;
    this.nextWaypointIdx = 0;
    this.gridPos = { r: loop[0].r, c: loop[0].c };

    const startWorldPos = this.grid.getWorldPosition(loop[0].r, loop[0].c);
    this.bearMesh.root.position.set(startWorldPos.x, startWorldPos.y + 0.5, startWorldPos.z);
    this.bearMesh.root.visible = true;

    // Roam around the circular loop for 12 to 16 hops (3 to 4 complete circuits)
    this.roamStepsRemaining = 12 + Math.floor(Math.random() * 5);
    this.state = 'ROAMING';
    this.isMoving = false;
    this.hopPauseTimer = 0.30;

    this.audio.playBearRoar();
    this.particles.spawnBearPoof(this.bearMesh.root.position);
  }

  // Plan and initiate the next circular step in the patrol loop
  planNextHop() {
    if (this.state !== 'ROAMING' || this.isMoving) return;

    // Despawn if quota completed
    if (this.roamStepsRemaining <= 0) {
      this.despawnPoof();
      return;
    }

    // Despawn if player has moved far past the patrol territory
    const maxLoopRow = Math.max(...this.patrolLoop.map(p => p.r));
    if (this.player.gridPos.r > maxLoopRow + 5) {
      this.despawnPoof();
      return;
    }

    const fromPt = this.patrolLoop[this.currentWaypointIdx];
    const nextIdx = (this.currentWaypointIdx + 1) % this.patrolLoop.length;
    const toPt = this.patrolLoop[nextIdx];

    const toCube = this.grid.getCube(toPt.r, toPt.c);
    if (!toCube || toCube.collapsed) {
      // Territory broken by external hazard/collapse
      this.dieFalling('Territory collapsed');
      return;
    }

    const fromPos = this.grid.getWorldPosition(fromPt.r, fromPt.c);
    const toPos = this.grid.getWorldPosition(toPt.r, toPt.c);

    // Calculate facing orientation along travel direction
    const dx = toPos.x - fromPos.x;
    const dz = toPos.z - fromPos.z;
    this.targetRotY = Math.atan2(dx, dz);

    this.initiateHop(toPt.r, toPt.c, nextIdx);
  }

  initiateHop(targetR, targetC, nextWaypointIdx) {
    this.isMoving = true;
    this.hopStartPos.copy(this.bearMesh.root.position);

    const targetPos = this.grid.getWorldPosition(targetR, targetC);
    this.hopEndPos.set(targetPos.x, targetPos.y + 0.5, targetPos.z);

    this.hopProgress = 0;
    this.hopDuration = 0.48;
    this.gridPos = { r: targetR, c: targetC };
    this.nextWaypointIdx = nextWaypointIdx;
  }

  onLanded() {
    this.isMoving = false;
    this.currentWaypointIdx = this.nextWaypointIdx;
    this.roamStepsRemaining--;
    this.hopPauseTimer = this.hopPauseDuration;

    this.particles.spawnLandingDust(this.bearMesh.root.position);

    const cube = this.grid.getCube(this.gridPos.r, this.gridPos.c);
    if (!cube || cube.collapsed) {
      this.dieFalling('Stepped into abyss');
      return;
    }

    // Check collision with player on landing
    this.checkPlayerCatch();
  }

  // Check if bear has collided with the player
  checkPlayerCatch() {
    if (this.state !== 'ROAMING') return;
    if (!this.player || this.player.isDead) return;

    const dist = this.bearMesh.root.position.distanceTo(this.player.charMesh.root.position);
    if (dist < 0.68) {
      if (this.player.shieldTimer > 0) {
        // Player Shield Deflects and Destroys the Bear!
        this.audio.playBearWhimper();
        this.particles.spawnBearShatter(this.bearMesh.root.position);
        this.despawnPoof();
      } else {
        // Bear Catches Player -> Player Fails!
        this.audio.playBearRoar();
        this.player.die('The roaming cubic bear caught you!');
        this.despawnPoof();
      }
    }
  }

  fallWithCube() {
    if (this.state === 'FALLING' || this.state === 'DEAD' || this.state === 'INACTIVE') return;
    this.state = 'FALLING';
    this.audio.playBearWhimper();

    const startPos = this.bearMesh.root.position.clone();
    const startTime = performance.now();

    const anim = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed < 0.85) {
        this.bearMesh.root.position.y = startPos.y - elapsed * elapsed * 24.0;
        this.bearMesh.root.rotation.x += 0.22;
        this.bearMesh.root.rotation.z += 0.22;
        requestAnimationFrame(anim);
      } else {
        this.bearMesh.root.visible = false;
        this.state = 'INACTIVE';
        this.spawnCooldown = 12.0 + Math.random() * 6.0; // Higher frequency (~12-18s)
      }
    };
    anim();
  }

  dieFalling(reason = '') {
    if (this.state === 'FALLING' || this.state === 'DEAD' || this.state === 'INACTIVE') return;
    this.fallWithCube();
  }

  dieShatter() {
    if (this.state === 'DEAD' || this.state === 'INACTIVE') return;
    this.state = 'DEAD';
    this.particles.spawnBearShatter(this.bearMesh.root.position);
    this.bearMesh.root.visible = false;
    this.state = 'INACTIVE';
    this.spawnCooldown = 12.0 + Math.random() * 6.0; // Higher frequency (~12-18s)
  }

  despawnPoof() {
    this.particles.spawnBearPoof(this.bearMesh.root.position);
    this.audio.playBearPoof();
    this.bearMesh.root.visible = false;
    this.state = 'INACTIVE';
    this.spawnCooldown = 12.0 + Math.random() * 6.0; // Higher frequency (~12-18s)
  }

  update(delta) {
    if (this.state === 'INACTIVE') {
      if (this.spawnCooldown > 0) {
        this.spawnCooldown -= delta;
      }
      return;
    }

    // Smooth Facing Rotation
    this.bearMesh.root.rotation.y = THREE.MathUtils.lerp(
      this.bearMesh.root.rotation.y,
      this.targetRotY,
      0.35
    );

    // Continuous Player Catch Check during movement
    this.checkPlayerCatch();

    // Hop Movement Interpolation
    if (this.isMoving) {
      this.hopProgress += delta / this.hopDuration;
      if (this.hopProgress >= 1.0) {
        this.hopProgress = 1.0;
        this.bearMesh.root.position.copy(this.hopEndPos);
        this.onLanded();
      } else {
        this.bearMesh.root.position.x = THREE.MathUtils.lerp(
          this.hopStartPos.x,
          this.hopEndPos.x,
          this.hopProgress
        );
        this.bearMesh.root.position.z = THREE.MathUtils.lerp(
          this.hopStartPos.z,
          this.hopEndPos.z,
          this.hopProgress
        );

        const linearY = THREE.MathUtils.lerp(this.hopStartPos.y, this.hopEndPos.y, this.hopProgress);
        const arcY = Math.sin(this.hopProgress * Math.PI) * GAME_CONFIG.HOP_HEIGHT;
        this.bearMesh.root.position.y = linearY + arcY;
      }
    } else if (this.state === 'ROAMING') {
      // Pause timer between hops
      if (this.hopPauseTimer > 0) {
        this.hopPauseTimer -= delta;
      } else {
        this.planNextHop();
      }
    }

    // Update Mesh Animations
    this.bearMesh.update(delta, this.isMoving, this.hopProgress, false);
  }
}
