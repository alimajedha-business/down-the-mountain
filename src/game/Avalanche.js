// Top-Down Mountain Collapse (Avalanche) with Rapid Chase Mechanics
import { GAME_CONFIG } from '../config.js';

export class Avalanche {
  constructor(grid, particles, audio) {
    this.grid = grid;
    this.particles = particles;
    this.audio = audio;

    this.collapsedRow = -1;
    this.timer = 0;
    this.initialDelay = GAME_CONFIG.AVALANCHE_INITIAL_DELAY; // 2.0s
    this.isActive = false;

    this.onPlayerCaught = null;
  }

  reset() {
    this.collapsedRow = -1;
    this.timer = 0;
    this.initialDelay = GAME_CONFIG.AVALANCHE_INITIAL_DELAY;
    this.isActive = false;
  }

  update(delta, playerRow) {
    if (!this.isActive) {
      this.initialDelay -= delta;
      if (this.initialDelay <= 0) {
        this.isActive = true;
      }
      return;
    }

    this.timer += delta;
    if (this.timer >= GAME_CONFIG.AVALANCHE_ROW_INTERVAL) {
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
