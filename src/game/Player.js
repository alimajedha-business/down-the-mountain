// Player Entity, Hop Mechanics, Dynamic Facing Direction, Waterfall Sliding, Shield, and Dramatic Failure Sequence
import * as THREE from 'three';
import { GAME_CONFIG, CUBE_TYPES } from '../config.js';

export class Player {
  constructor(scene, grid, characterMesh, hazards, particles, audio, sceneMgr) {
    this.scene = scene;
    this.grid = grid;
    this.charMesh = characterMesh;
    this.hazards = hazards;
    this.particles = particles;
    this.audio = audio;
    this.sceneMgr = sceneMgr;

    this.scene.add(this.charMesh.root);

    this.gridPos = { r: 0, c: 2 };
    this.isMoving = false;
    this.isDead = false;
    this.isSliding = false;

    this.hopStartPos = new THREE.Vector3();
    this.hopEndPos = new THREE.Vector3();
    this.hopProgress = 0;
    this.hopDuration = GAME_CONFIG.HOP_DURATION;

    // Dynamic Facing Direction (0 = Left, Math.PI/2 = Right)
    this.targetRotY = 0;

    // Shield & Idle Timers
    this.shieldTimer = 0;
    this.cubeIdleTimer = 0;

    // Delta-based river slide timer (replaces setTimeout)
    this.slideDelayTimer = 0;
    this.slideNextCell = null;
    this.slideDir = null;

    // Mud/Clay sticky jump counter & hop state
    this.mudStickyJumps = 0;
    this.isCurrentHopSticky = false;

    // Fast-Rhythm Combo Streak System
    this.comboCount = 0;
    this.comboTimer = 0;

    // Callbacks
    this.onScoreUpdate = null;
    this.onStarCollect = null;
    this.onShieldUpdate = null;
    this.onMudUpdate = null;
    this.onComboUpdate = null;
    this.onDeath = null;

    this.reset();
  }

  reset() {
    this.gridPos = { r: 0, c: 2 };
    this.isMoving = false;
    this.isDead = false;
    this.isSliding = false;
    this.shieldTimer = 0;
    this.cubeIdleTimer = 0;
    this.slideDelayTimer = 0;
    this.slideNextCell = null;
    this.slideDir = null;
    this.mudStickyJumps = 0;
    this.isCurrentHopSticky = false;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.targetRotY = 0;
    this.charMesh.setShieldActive(false);
    this.charMesh.root.visible = true;

    const worldPos = this.grid.getWorldPosition(this.gridPos.r, this.gridPos.c);
    this.charMesh.root.position.set(worldPos.x, worldPos.y + 0.5, worldPos.z);
    this.charMesh.root.rotation.set(0, 0, 0);
    this.charMesh.root.scale.set(1, 1, 1);
    this.charMesh.bodyGroup.scale.set(1, 1, 1);
  }

  jumpLeft() {
    if (this.isMoving || this.isDead || this.isSliding) return;
    this.targetRotY = -Math.PI / 2; // Face Left
    const dest = this.grid.getLeftCell(this.gridPos.r, this.gridPos.c);
    this.attemptJump(dest.r, dest.c);
  }

  jumpRight() {
    if (this.isMoving || this.isDead || this.isSliding) return;
    this.targetRotY = 0; // Face Right
    const dest = this.grid.getRightCell(this.gridPos.r, this.gridPos.c);
    this.attemptJump(dest.r, dest.c);
  }

  attemptJump(targetR, targetC) {
    if (!this.grid.isCellValid(targetR, targetC)) {
      this.initiateFall(targetR, targetC);
      return;
    }

    const targetCube = this.grid.getCube(targetR, targetC);

    if (targetCube && targetCube.type === CUBE_TYPES.TREE) {
      this.audio.playJump(0.8);
      this.charMesh.bodyGroup.scale.set(1.2, 0.8, 1.2);
      return;
    }

    this.initiateHop(targetR, targetC);
  }

  initiateHop(targetR, targetC, isSlide = false) {
    this.isMoving = true;
    this.cubeIdleTimer = 0;
    this.hopStartPos.copy(this.charMesh.root.position);
    const targetPos = this.grid.getWorldPosition(targetR, targetC);
    this.hopEndPos.set(targetPos.x, targetPos.y + 0.5, targetPos.z);
    this.hopProgress = 0;

    const baseDuration = isSlide ? GAME_CONFIG.RIVER_SLIDE_SPEED : GAME_CONFIG.HOP_DURATION;
    const isStickyHop = this.mudStickyJumps > 0 && !isSlide;

    if (isStickyHop) {
      this.isCurrentHopSticky = true;
      this.hopDuration = baseDuration * GAME_CONFIG.MUD_HOP_MULTIPLIER;
      this.mudStickyJumps--;
      if (this.onMudUpdate) {
        this.onMudUpdate(this.mudStickyJumps, GAME_CONFIG.DIRT_STICKY_JUMPS);
      }
      this.audio.playMudSquelch();
      this.particles.spawnMudSplatter(this.hopStartPos);
    } else {
      this.isCurrentHopSticky = false;
      this.hopDuration = baseDuration;
    }

    this.gridPos = { r: targetR, c: targetC };

    if (!isSlide) {
      if (this.comboTimer > 0) {
        this.comboCount++;
      } else {
        this.comboCount = 1;
      }
      this.comboTimer = GAME_CONFIG.COMBO_WINDOW;
      if (this.onComboUpdate) {
        this.onComboUpdate(this.comboCount);
      }

      this.audio.playJump(1.0 + (targetR % 10) * 0.02);
    }

    if (this.onScoreUpdate) {
      this.onScoreUpdate(targetR);
    }
  }

  initiateFall(targetR, targetC) {
    if (this.isDead) return;
    this.isDead = true;
    this.triggerFailEffects();

    const isOdd = targetR % 2 !== 0;
    const k = isOdd ? (targetC - 1.5) : (targetC - 2.0);
    const x = (targetR * 0.5 + k) * 1.0;
    const y = -targetR * GAME_CONFIG.BLOCK_SPACING_Y - 8.0;
    const z = (targetR * 0.5 - k) * 1.0;

    const startPos = this.charMesh.root.position.clone();
    const startTime = performance.now();

    const fallAnim = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed < 0.9) {
        this.charMesh.root.position.x = THREE.MathUtils.lerp(startPos.x, x, elapsed / 0.9);
        this.charMesh.root.position.z = THREE.MathUtils.lerp(startPos.z, z, elapsed / 0.9);
        this.charMesh.root.position.y = startPos.y - elapsed * elapsed * 20.0;
        this.charMesh.root.rotation.x += 0.25;
        this.charMesh.root.rotation.z += 0.25;
        requestAnimationFrame(fallAnim);
      } else {
        this.charMesh.root.visible = false;
        if (this.onDeath) this.onDeath('You stepped off the mountain edge!');
      }
    };
    fallAnim();
  }

  onLanded() {
    this.isMoving = false;
    this.particles.spawnLandingDust(this.charMesh.root.position);

    const cube = this.grid.getCube(this.gridPos.r, this.gridPos.c);
    if (!cube || cube.collapsed) {
      this.die('You fell into the collapsed mountain!');
      return;
    }

    switch (cube.type) {
      case CUBE_TYPES.STAR:
        if (!cube.starCollected) {
          cube.starCollected = true;
          if (cube.mesh && cube.mesh.userData.starMesh) {
            cube.mesh.userData.starMesh.visible = false;
          }
          this.audio.playStarCollect();
          this.particles.spawnStarSparkles(this.charMesh.root.position);
          if (this.onStarCollect) this.onStarCollect(GAME_CONFIG.STAR_COINS);
        }
        break;

      case CUBE_TYPES.SHIELD:
        if (!cube.triggered) {
          cube.triggered = true;
          if (cube.mesh && cube.mesh.userData.pickupMesh) {
            cube.mesh.userData.pickupMesh.visible = false;
          }
          this.activateShield(GAME_CONFIG.SHIELD_DURATION);
        }
        break;

      case CUBE_TYPES.RIVER:
        this.processWaterfallSlide(cube);
        break;

      case CUBE_TYPES.CRACKED:
        this.hazards.triggerCrackedCube(cube, (r, c) => {
          const dist = Math.hypot(this.charMesh.root.position.x - cube.worldPos.x, this.charMesh.root.position.z - cube.worldPos.z);
          if (((this.gridPos.r === r && this.gridPos.c === c) || dist < 0.8) && !this.isDead) {
            this.fallWithCrackedCube('The cracked earth gave way and you fell down the mountain!');
          }
        });
        break;

      case CUBE_TYPES.TNT:
        // First TNT stepped on: 2.0 second fuse
        this.hazards.triggerTNT(cube, false);
        break;

      case CUBE_TYPES.MAGMA:
        if (this.shieldTimer <= 0) {
          this.audio.playMagmaBurn();
          this.particles.spawnLavaEmbers(this.charMesh.root.position);
          this.die('You stepped on burning volcanic magma!');
        } else {
          this.particles.spawnLavaEmbers(this.charMesh.root.position);
        }
        break;

      case CUBE_TYPES.TRAP:
        if (cube.spikesActive && this.shieldTimer <= 0) {
          this.audio.playSpike();
          this.die('You were impaled by spike traps!');
        }
        break;

      case CUBE_TYPES.DIRT:
        // Mud/clay glue sticks to feet, slowing movement for 3 jumps
        this.mudStickyJumps = GAME_CONFIG.DIRT_STICKY_JUMPS;
        this.audio.playMudSquelch();
        this.particles.spawnMudSplatter(this.charMesh.root.position);
        if (this.onMudUpdate) {
          this.onMudUpdate(this.mudStickyJumps, GAME_CONFIG.DIRT_STICKY_JUMPS);
        }
        break;
    }
  }

  // Waterfall Slide: Uses delta-based timer (pause-safe) instead of setTimeout
  processWaterfallSlide(currentRiverCube) {
    this.isSliding = true;
    this.audio.playRiverSlide();
    this.particles.spawnRiverSplash(this.charMesh.root.position);

    const dir = (currentRiverCube.customData && currentRiverCube.customData.riverDir) ? currentRiverCube.customData.riverDir : 'left';
    this.targetRotY = (dir === 'left') ? -Math.PI / 2 : 0;

    const nextCell = (dir === 'left')
      ? this.grid.getLeftCell(this.gridPos.r, this.gridPos.c)
      : this.grid.getRightCell(this.gridPos.r, this.gridPos.c);

    // Queue the slide transition via delta timer (processed in update())
    this.slideDelayTimer = GAME_CONFIG.RIVER_SLIDE_SPEED;
    this.slideNextCell = nextCell;
  }

  activateShield(duration) {
    this.shieldTimer = duration;
    this.charMesh.setShieldActive(true);
    this.audio.playShieldActivate();
  }

  triggerFailEffects() {
    if (this.sceneMgr) {
      this.sceneMgr.shake(0.55, 0.45);
    }

    const flash = document.getElementById('damage-flash');
    if (flash) {
      flash.classList.add('active');
      setTimeout(() => flash.classList.remove('active'), 250);
    }

    this.audio.playGameOver();
  }

  fallWithCrackedCube(reason = 'The cracked earth gave way and you fell down the mountain!') {
    if (this.isDead) return;
    this.isDead = true;
    this.triggerFailEffects();

    const startPos = this.charMesh.root.position.clone();
    const startTime = performance.now();
    const rotDirX = (Math.random() - 0.5) * 4.0;
    const rotDirZ = (Math.random() - 0.5) * 4.0;

    const fallAnim = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed < 0.85) {
        this.charMesh.root.position.y = startPos.y - elapsed * elapsed * 26.0;
        this.charMesh.root.position.x = startPos.x + rotDirX * elapsed * 0.35;
        this.charMesh.root.position.z = startPos.z + rotDirZ * elapsed * 0.35;
        this.charMesh.root.rotation.x += 0.22;
        this.charMesh.root.rotation.z += 0.22;
        requestAnimationFrame(fallAnim);
      } else {
        this.charMesh.root.visible = false;
        if (this.onDeath) this.onDeath(reason);
      }
    };
    fallAnim();
  }

  die(reason = 'Game Over') {
    if (this.isDead) return;
    this.isDead = true;

    this.triggerFailEffects();

    // Spawn dramatic voxel explosion
    this.particles.spawnCharacterShatter(this.charMesh.root.position, 0x64dd17);
    this.charMesh.root.visible = false;

    // Dramatic 0.75s pause before showing game-over modal
    setTimeout(() => {
      if (this.onDeath) this.onDeath(reason);
    }, 750);
  }

  update(delta) {
    if (this.shieldTimer > 0) {
      this.shieldTimer -= delta;
      if (this.onShieldUpdate) {
        this.onShieldUpdate(Math.max(0, this.shieldTimer), GAME_CONFIG.SHIELD_DURATION);
      }
      if (this.shieldTimer <= 0) {
        this.shieldTimer = 0;
        this.charMesh.setShieldActive(false);
      }
    }

    // Smooth rotation towards target facing direction
    if (!this.isDead) {
      this.charMesh.root.rotation.y = THREE.MathUtils.lerp(
        this.charMesh.root.rotation.y,
        this.targetRotY,
        0.35
      );
    }

    // Delta-based river slide delay (pause-safe, replaces setTimeout)
    if (this.isSliding && this.slideDelayTimer > 0) {
      this.slideDelayTimer -= delta;
      if (this.slideDelayTimer <= 0) {
        this.slideDelayTimer = 0;
        this.isSliding = false;
        if (!this.isDead && this.slideNextCell) {
          const nextCell = this.slideNextCell;
          this.slideNextCell = null;
          if (this.grid.isCellValid(nextCell.r, nextCell.c)) {
            this.initiateHop(nextCell.r, nextCell.c, true);
          } else {
            this.initiateFall(nextCell.r, nextCell.c);
          }
        }
      }
    }

    if (this.isMoving) {
      this.hopProgress += delta / this.hopDuration;
      if (this.hopProgress >= 1.0) {
        this.hopProgress = 1.0;
        this.charMesh.root.position.copy(this.hopEndPos);
        const wasSticky = this.isCurrentHopSticky;
        this.isCurrentHopSticky = false;
        if (!this.isDead) {
          if (wasSticky) {
            this.particles.spawnMudSplatter(this.charMesh.root.position);
          }
          this.onLanded();
        }
      } else {
        const progress = this.isCurrentHopSticky
          ? Math.pow(this.hopProgress, 1.15)
          : this.hopProgress;

        this.charMesh.root.position.x = THREE.MathUtils.lerp(this.hopStartPos.x, this.hopEndPos.x, progress);
        this.charMesh.root.position.z = THREE.MathUtils.lerp(this.hopStartPos.z, this.hopEndPos.z, progress);

        const linearY = THREE.MathUtils.lerp(this.hopStartPos.y, this.hopEndPos.y, progress);
        const arcY = this.isSliding ? 0 : Math.sin(this.hopProgress * Math.PI) * (this.isCurrentHopSticky ? GAME_CONFIG.HOP_HEIGHT * 0.9 : GAME_CONFIG.HOP_HEIGHT);
        this.charMesh.root.position.y = linearY + arcY;
      }
    }

    if (!this.isDead && !this.isMoving && !this.isSliding) {
      // Combo decay when idle
      if (this.comboTimer > 0) {
        this.comboTimer -= delta;
        if (this.comboTimer <= 0) {
          this.comboTimer = 0;
          this.comboCount = 0;
          if (this.onComboUpdate) {
            this.onComboUpdate(0);
          }
        }
      }

      const cube = this.grid.getCube(this.gridPos.r, this.gridPos.c);
      if (cube) {
        if (cube.type === CUBE_TYPES.TRAP && cube.spikesActive && this.shieldTimer <= 0) {
          this.audio.playSpike();
          this.die('You were impaled by spike traps!');
          return;
        }
      }
    }

    this.charMesh.update(delta, this.isMoving, this.hopProgress, this.isCurrentHopSticky);
  }
}
