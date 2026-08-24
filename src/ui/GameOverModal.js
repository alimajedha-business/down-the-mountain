// Game Over Modal UI Controller
import { Storage } from '../core/Storage.js';

export class GameOverModal {
  constructor(audio, options = {}) {
    this.audio = audio;
    this.onPlayAgain = options.onPlayAgain || (() => {});
    this.onReturnMenu = options.onReturnMenu || (() => {});

    this.modal = document.getElementById('gameover-modal');
    this.newBestBadge = document.getElementById('new-best-banner');
    this.deathTitle = document.getElementById('death-reason-title');
    this.deathSub = document.getElementById('death-reason-sub');
    this.scoreVal = document.getElementById('go-score');
    this.bestVal = document.getElementById('go-best');
    this.starsVal = document.getElementById('go-stars');

    this.initEventListeners();
  }

  initEventListeners() {
    document.getElementById('btn-play-again')?.addEventListener('click', () => {
      this.audio.playClick();
      this.hide();
      this.onPlayAgain();
    });

    document.getElementById('btn-go-menu')?.addEventListener('click', () => {
      this.audio.playClick();
      this.hide();
      this.onReturnMenu();
    });
  }

  show(score, starsCollected, deathReason) {
    const prevBest = Storage.getHighScore();
    const isNewBest = score > prevBest;

    if (isNewBest) {
      Storage.setHighScore(score);
      if (this.newBestBadge) this.newBestBadge.classList.remove('hidden');
    } else {
      if (this.newBestBadge) this.newBestBadge.classList.add('hidden');
    }

    if (this.deathSub) {
      this.deathSub.textContent = deathReason || 'You lost your balance!';
    }

    if (this.scoreVal) this.scoreVal.textContent = score.toString();
    if (this.bestVal) this.bestVal.textContent = Math.max(score, prevBest).toString();
    if (this.starsVal) this.starsVal.textContent = `⭐ +${starsCollected}`;

    if (this.modal) this.modal.classList.remove('hidden');
  }

  hide() {
    if (this.modal) this.modal.classList.add('hidden');
  }
}
