// In-Game HUD UI Controller
export class HUD {
  constructor(options = {}) {
    this.hudElement = document.getElementById('game-hud');
    this.scoreText = document.getElementById('hud-score');
    this.shieldHud = document.getElementById('shield-hud');
    this.shieldBar = document.getElementById('shield-bar-fill');
    this.shieldTimeText = document.getElementById('shield-timer-text');
    this.mudHud = document.getElementById('mud-hud');
    this.mudTimeText = document.getElementById('mud-timer-text');
    this.btnPause = document.getElementById('btn-pause');

    this.onPauseClick = options.onPauseClick || (() => {});

    if (this.btnPause) {
      this.btnPause.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onPauseClick();
      });
    }
  }

  show() {
    if (this.hudElement) this.hudElement.classList.remove('hidden');
  }

  hide() {
    if (this.hudElement) this.hudElement.classList.add('hidden');
  }

  setScore(val) {
    if (this.scoreText) this.scoreText.textContent = val.toString();
  }



  setShield(remaining, total) {
    if (!this.shieldHud) return;

    if (remaining > 0) {
      this.shieldHud.classList.remove('hidden');
      const pct = (remaining / total) * 100;
      if (this.shieldBar) this.shieldBar.style.width = `${pct}%`;
      if (this.shieldTimeText) this.shieldTimeText.textContent = `${remaining.toFixed(1)}s`;
    } else {
      this.shieldHud.classList.add('hidden');
    }
  }

  setMud(remaining, total = 3) {
    if (!this.mudHud) return;

    if (remaining > 0) {
      this.mudHud.classList.remove('hidden');
      if (this.mudTimeText) {
        this.mudTimeText.textContent = `${remaining} ${remaining === 1 ? 'HOP' : 'HOPS'}`;
      }
    } else {
      this.mudHud.classList.add('hidden');
    }
  }
}
