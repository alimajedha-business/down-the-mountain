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

    // Combo and Announcement elements
    this.comboHud = document.getElementById('combo-hud');
    this.comboCountText = document.getElementById('combo-count-text');
    this.stageToast = document.getElementById('stage-toast');
    this.stageToastTitle = document.getElementById('stage-toast-title');
    this.stageToastSub = document.getElementById('stage-toast-sub');
    this.midrunBestToast = document.getElementById('midrun-best-toast');

    this.stageToastTimeout = null;
    this.bestToastTimeout = null;

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
    if (this.comboHud) this.comboHud.classList.add('hidden');
    if (this.stageToast) this.stageToast.classList.add('hidden');
    if (this.midrunBestToast) this.midrunBestToast.classList.add('hidden');
    if (this.stageToastTimeout) clearTimeout(this.stageToastTimeout);
    if (this.bestToastTimeout) clearTimeout(this.bestToastTimeout);
  }

  setScore(val) {
    if (this.scoreText) this.scoreText.textContent = val.toString();
  }

  setCombo(count) {
    if (!this.comboHud) return;

    if (count >= 4) {
      this.comboHud.classList.remove('hidden');
      if (this.comboCountText) {
        this.comboCountText.textContent = `${count}x`;
      }
      // Re-trigger bounce pop animation
      this.comboHud.classList.remove('pop');
      void this.comboHud.offsetWidth;
      this.comboHud.classList.add('pop');
    } else {
      this.comboHud.classList.add('hidden');
    }
  }

  showTierAnnouncement(tier) {
    if (!this.stageToast) return;

    if (this.stageToastTitle) {
      this.stageToastTitle.textContent = `STAGE ${tier.id}: ${tier.name.toUpperCase()}`;
    }
    if (this.stageToastSub) {
      this.stageToastSub.textContent = tier.tagline || '';
    }

    if (this.stageToastTimeout) clearTimeout(this.stageToastTimeout);

    this.stageToast.classList.remove('hidden');
    this.stageToast.classList.remove('active');
    void this.stageToast.offsetWidth;
    this.stageToast.classList.add('active');

    this.stageToastTimeout = setTimeout(() => {
      if (this.stageToast) {
        this.stageToast.classList.remove('active');
        this.stageToast.classList.add('hidden');
      }
    }, 2800);
  }

  showNewBestMidRunToast() {
    if (!this.midrunBestToast) return;

    if (this.bestToastTimeout) clearTimeout(this.bestToastTimeout);

    this.midrunBestToast.classList.remove('hidden');
    this.midrunBestToast.classList.remove('active');
    void this.midrunBestToast.offsetWidth;
    this.midrunBestToast.classList.add('active');

    this.bestToastTimeout = setTimeout(() => {
      if (this.midrunBestToast) {
        this.midrunBestToast.classList.remove('active');
        this.midrunBestToast.classList.add('hidden');
      }
    }, 2400);
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

