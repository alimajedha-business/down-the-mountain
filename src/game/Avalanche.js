// Top-Down Mountain Collapse (Avalanche) with Dynamic Difficulty-Scaled Chase
import { GAME_CONFIG, getTierForScore } from '../config.js';

export class Avalanche {
  constructor(grid, particles, audio) {
    this.grid = grid;
    this.particles = particles;
    this.audio = audio;

    this.collapsedRow = -1;
    this.timer = 0;
    this.initialDelay = GAME_CONFIG.AVALANCHE_INITIAL_DELAY; // 4.0s
    this.isActive = false;

    this.onPlayerCaught = null;
  }

  reset() {
    this.collapsedRow = -1;
    this.timer = 0;
    this.initialDelay = GAME_CONFIG.AVALANCHE_INITIAL_DELAY;
    this.isActive = false;
  }

  getCurrentInterval(playerRow) {
    const tier = getTierForScore(playerRow);
    let baseInterval = tier.avalancheInterval || 0.50;
    if (playerRow > 100) {
      const extra = playerRow - 100;
      baseInterval = Math.max(0.28, baseInterval - extra * 0.0006);
    }
    // Dynamic rubber-banding: if avalanche is > 10 rows behind, speed it up slightly
    const distanceBehind = playerRow - this.collapsedRow;
    if (distanceBehind > 10) {
      baseInterval = Math.max(0.22, baseInterval * 0.75);
    }
    return baseInterval;
  }

  update(delta, playerRow) {
    if (!this.isActive) {
      this.initialDelay -= delta;
      if (this.initialDelay <= 0) {
        this.isActive = true;
      }
      return;
    }

    const interval = this.getCurrentInterval(playerRow);
    this.timer += delta;
    if (this.timer >= interval) {
      this.timer = 0;
      this.collapseNextRow(playerRow);
    }
  }

  collapseNextRow(playerRow) {
    const nextRowToCollapse = this.collapsedRow + 1;
    if (nextRowToCollapse > playerRow) return;

    this.collapsedRow = nextRowToCollapse;
    const rowCubes = this.grid.rows.get(this.collapsedRow);

    if (rowCubes) {
      this.audio.playAvalancheRumble();

      rowCubes.forEach(cube => {
        if (!cube.collapsed) {
          this.grid.collapseCube(cube);
          this.particles.spawnCrumblyDebris(cube.worldPos);
        }
      });
    }

    if (this.collapsedRow >= playerRow) {
      if (this.onPlayerCaught) {
        this.onPlayerCaught('The mountain collapsed from behind you!');
      }
    }
  }
}
