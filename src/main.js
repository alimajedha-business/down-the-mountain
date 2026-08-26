// Main Game Orchestrator for Down the Mountain 3D
import { GAME_CONFIG, BIOMES } from './config.js';
import { Storage } from './core/Storage.js';
import { AudioManager } from './core/AudioManager.js';
import { InputManager } from './core/InputManager.js';

import { SceneManager } from './graphics/SceneManager.js';
import { VoxelMeshes } from './graphics/VoxelMeshes.js';
import { CharacterMesh } from './graphics/CharacterMesh.js';
import { ParticleSystem } from './graphics/ParticleSystem.js';

import { MountainGrid } from './game/MountainGrid.js';
import { Hazards } from './game/Hazards.js';
import { Player } from './game/Player.js';
import { Avalanche } from './game/Avalanche.js';
import { BearChaser } from './game/BearChaser.js';

import { HUD } from './ui/HUD.js';
import { Menu } from './ui/Menu.js';
import { GameOverModal } from './ui/GameOverModal.js';

const STATES = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAMEOVER: 'gameover'
};

export class Game {
  constructor() {
    this.state = STATES.MENU;
    this.currentScore = 0;
    this.starsCollectedInRun = 0;

    // Core Systems
    this.audio = new AudioManager();

    // 3D Scene & Graphics
    const container = document.getElementById('canvas-container') || document.body;
    this.sceneMgr = new SceneManager(container);
    this.voxelMeshes = new VoxelMeshes();
    this.particles = new ParticleSystem(this.sceneMgr.scene);

    // Mountain Grid & Hazards
    this.grid = new MountainGrid(this.sceneMgr.scene, this.voxelMeshes);
    this.hazards = new Hazards(this.grid, this.voxelMeshes, this.particles, this.audio);
    this.grid.setHazards(this.hazards);

    // Player Entity
    this.charMesh = new CharacterMesh();
    this.player = new Player(
      this.sceneMgr.scene,
      this.grid,
      this.charMesh,
      this.hazards,
      this.particles,
      this.audio,
      this.sceneMgr
    );

    // Top-Down Mountain Collapse
    this.avalanche = new Avalanche(this.grid, this.particles, this.audio);

    // Cubic Bear Chaser Entity
    this.bear = new BearChaser(
      this.sceneMgr.scene,
      this.grid,
      this.player,
      this.hazards,
      this.particles,
      this.audio
    );

    // UI Layers
    this.hud = new HUD({
      onPauseClick: () => this.pauseGame()
    });

    this.menu = new Menu(this.audio, {
      onStartGame: () => this.startGame(),
      onResumeGame: () => this.resumeGame(),
      onRestartGame: () => this.startGame(),
      onQuitToMenu: () => this.returnToMenu()
    });

    this.gameOverModal = new GameOverModal(this.audio, {
      onPlayAgain: () => this.startGame(),
      onReturnMenu: () => this.returnToMenu()
    });

    // Input Controller
    this.input = new InputManager({
      onMoveLeft: () => this.handleMoveLeft(),
      onMoveRight: () => this.handleMoveRight(),
      onPause: () => this.togglePause(),
      onAction: (code) => this.handleQuickAction(code)
    });

    this.initCallbacks();
    this.initGameLoop();

    // Initial grid setup
    this.hazards.reset();
    this.grid.reset();
    const startPos = this.grid.getWorldPosition(0, Math.floor(GAME_CONFIG.GRID_WIDTH / 2));
    this.sceneMgr.setCameraTarget(startPos, true);
  }

  initCallbacks() {
    this.player.onScoreUpdate = (row) => {
      this.currentScore = row;
      this.hud.setScore(this.currentScore);
      this.updateBiomeProgress(this.currentScore);
    };

    this.player.onStarCollect = (amount) => {
      this.starsCollectedInRun += amount;
      Storage.addStars(amount);
    };

    this.player.onShieldUpdate = (remaining, total) => {
      this.hud.setShield(remaining, total);
    };

    this.player.onMudUpdate = (remaining, total) => {
      this.hud.setMud(remaining, total);
    };

    this.player.onDeath = (reason) => {
      this.handleGameOver(reason);
    };

    this.avalanche.onPlayerCaught = (reason) => {
      if (this.state === STATES.PLAYING && !this.player.isDead) {
        this.player.fallWithCrackedCube(reason);
      }
    };
  }

  startGame() {
    this.state = STATES.PLAYING;
    this.currentScore = 0;
    this.starsCollectedInRun = 0;

    this.menu.hideMenu();
    this.gameOverModal.hide();

    this.hazards.reset();
    this.grid.reset();
    this.player.reset();
    this.avalanche.reset();
    this.bear.reset();

    const startPos = this.grid.getWorldPosition(0, Math.floor(GAME_CONFIG.GRID_WIDTH / 2));
    this.sceneMgr.setCameraTarget(startPos, true);
    this.sceneMgr.setBiome(0);

    this.hud.setScore(0);
    this.hud.setShield(0, 1);
    this.hud.setMud(0, 1);
    this.hud.show();
    this.input.setEnabled(true);
  }

  handleMoveLeft() {
    if (this.state === STATES.MENU) {
      this.startGame();
      this.player.jumpLeft();
      return;
    }
    if (this.state !== STATES.PLAYING) return;
    this.player.jumpLeft();
  }

  handleMoveRight() {
    if (this.state === STATES.MENU) {
      this.startGame();
      this.player.jumpRight();
      return;
    }
    if (this.state !== STATES.PLAYING) return;
    this.player.jumpRight();
  }

  handleQuickAction(code) {
    if (this.state === STATES.GAMEOVER) {
      this.gameOverModal.hide();
      this.startGame();
    } else if (this.state === STATES.MENU) {
      this.startGame();
    }
  }

  togglePause() {
    if (this.state === STATES.PLAYING) {
      this.pauseGame();
    } else if (this.state === STATES.PAUSED) {
      this.resumeGame();
    }
  }

  pauseGame() {
    if (this.state !== STATES.PLAYING) return;
    this.state = STATES.PAUSED;
    this.menu.openPauseModal();
  }

  resumeGame() {
    if (this.state !== STATES.PAUSED) return;
    this.state = STATES.PLAYING;
    this.menu.closePauseModal();
  }

  returnToMenu() {
    this.state = STATES.MENU;
    this.hud.hide();
    this.gameOverModal.hide();
    this.bear.reset();
    this.menu.showMenu();
  }

  handleGameOver(reason) {
    this.state = STATES.GAMEOVER;
    this.input.setEnabled(false);
    this.hud.hide();
    this.gameOverModal.show(this.currentScore, this.starsCollectedInRun, reason);
  }

  updateBiomeProgress(depth) {
    const biomeIdx = Math.floor(depth / GAME_CONFIG.BIOME_STEP_INTERVAL) % BIOMES.length;
    this.sceneMgr.setBiome(biomeIdx);
  }

  initGameLoop() {
    let lastTime = performance.now();

    const loop = (currentTime) => {
      requestAnimationFrame(loop);

      const delta = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      this.sceneMgr.update(delta);
      this.grid.updateAnimations(delta);
      this.particles.update(delta);

      if (this.state === STATES.PLAYING) {
        this.player.update(delta);
        this.grid.update(this.player.gridPos.r);

        // Cubic Bear Chaser spawn & AI updates
        this.bear.trySpawn();
        this.bear.update(delta);

        const isShielded = this.player.shieldTimer > 0;
        this.hazards.update(
          delta,
          this.player.charMesh.root.position,
          isShielded,
          (tntR, tntC) => {
            const playerPos = this.player.charMesh.root.position;
            const playerR = this.player.gridPos.r;
            const playerC = this.player.gridPos.c;

            // Check if player is on the exploding cube itself
            const cube = this.grid.getCube(tntR, tntC);
            const cubePos = cube ? cube.worldPos : this.grid.getWorldPosition(tntR, tntC);
            const dist = Math.hypot(playerPos.x - cubePos.x, playerPos.z - cubePos.z);
            let isInBlastRadius = (playerR === tntR && playerC === tntC) || dist < 0.75;

            // Check if player is on any adjacent cube (6-neighbor diamond grid)
            if (!isInBlastRadius) {
              const isOdd = tntR % 2 !== 0;
              const adjacentCoords = [
                this.grid.getLeftCell(tntR, tntC),
                this.grid.getRightCell(tntR, tntC),
                { r: tntR, c: tntC - 1 },
                { r: tntR, c: tntC + 1 },
                { r: tntR - 1, c: isOdd ? tntC : tntC - 1 },
                { r: tntR - 1, c: isOdd ? tntC + 1 : tntC }
              ];
              for (const coord of adjacentCoords) {
                if (playerR === coord.r && playerC === coord.c) {
                  isInBlastRadius = true;
                  break;
                }
              }
            }

            if (isInBlastRadius && !isShielded && !this.player.isDead) {
              this.player.die('You were caught in a TNT explosion!');
            }

            // Check if Bear is caught in TNT explosion
            if (this.bear.state === 'ROAMING') {
              const bearPos = this.bear.bearMesh.root.position;
              const bearDist = Math.hypot(bearPos.x - cubePos.x, bearPos.z - cubePos.z);
              if ((this.bear.gridPos.r === tntR && this.bear.gridPos.c === tntC) || bearDist < 0.85) {
                this.bear.dieShatter();
              }
            }
          }
        );

        this.avalanche.update(delta, this.player.gridPos.r);
        this.sceneMgr.setCameraTarget(this.player.charMesh.root.position);
      }

      this.sceneMgr.render();
    };

    requestAnimationFrame(loop);
  }
}

function init() {
  if (!window.gameInstance) {
    try {
      window.gameInstance = new Game();
    } catch (err) {
      console.error('Game initialization error:', err);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
