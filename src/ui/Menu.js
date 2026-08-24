// Main Menu, Help Modal, and Pause Menu Controller
import { Storage } from '../core/Storage.js';

export class Menu {
  constructor(audio, options = {}) {
    this.audio = audio;

    this.onStartGame = options.onStartGame || (() => {});
    this.onResumeGame = options.onResumeGame || (() => {});
    this.onRestartGame = options.onRestartGame || (() => {});
    this.onQuitToMenu = options.onQuitToMenu || (() => {});

    this.menuOverlay = document.getElementById('menu-overlay');
    this.helpModal = document.getElementById('help-modal');
    this.pauseModal = document.getElementById('pause-modal');

    this.initEventListeners();
    this.updateMenuStats();
  }

  initEventListeners() {
    // Play Button (TAP TO PLAY)
    const btnPlay = document.getElementById('btn-play');
    if (btnPlay) {
      const handlePlay = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.audio.playClick();
        this.hideMenu();
        this.onStartGame();
      };
      btnPlay.addEventListener('click', handlePlay);
      btnPlay.addEventListener('touchend', handlePlay);
    }

    // Sound Toggle Button
    const btnSound = document.getElementById('btn-sound-toggle');
    if (btnSound) {
      this.updateSoundButtonUI(this.audio.enabled);
      btnSound.addEventListener('click', (e) => {
        e.stopPropagation();
        const enabled = this.audio.toggleSound();
        this.updateSoundButtonUI(enabled);
      });
    }

    // How to Play / Guide Button
    const btnHelp = document.getElementById('btn-open-help');
    if (btnHelp) {
      btnHelp.addEventListener('click', (e) => {
        e.stopPropagation();
        this.audio.playClick();
        this.openHelpModal();
      });
    }

    // Close Help Modal
    document.getElementById('btn-close-help-modal')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.audio.playClick();
      this.closeHelpModal();
    });

    // Pause Modal Buttons
    document.getElementById('btn-resume')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.audio.playClick();
      this.closePauseModal();
      this.onResumeGame();
    });

    document.getElementById('btn-restart-paused')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.audio.playClick();
      this.closePauseModal();
      this.onRestartGame();
    });

    document.getElementById('btn-quit-menu')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.audio.playClick();
      this.closePauseModal();
      this.showMenu();
      this.onQuitToMenu();
    });
  }

  showMenu() {
    this.updateMenuStats();
    if (this.menuOverlay) this.menuOverlay.classList.remove('hidden');
  }

  hideMenu() {
    if (this.menuOverlay) this.menuOverlay.classList.add('hidden');
  }

  openPauseModal() {
    if (this.pauseModal) this.pauseModal.classList.remove('hidden');
  }

  closePauseModal() {
    if (this.pauseModal) this.pauseModal.classList.add('hidden');
  }

  openHelpModal() {
    if (this.helpModal) this.helpModal.classList.remove('hidden');
  }

  closeHelpModal() {
    if (this.helpModal) this.helpModal.classList.add('hidden');
  }

  updateSoundButtonUI(enabled) {
    const icon = document.getElementById('sound-icon');
    const text = document.getElementById('sound-text');
    if (icon) icon.textContent = enabled ? '🔊' : '🔇';
    if (text) text.textContent = enabled ? 'SOUND ON' : 'SOUND OFF';
  }

  updateMenuStats() {
    const bestScore = Storage.getHighScore();
    const totalStars = Storage.getTotalStars();

    const bestEl = document.getElementById('menu-best-score');
    if (bestEl) bestEl.textContent = bestScore.toString();

    const starsEl = document.getElementById('menu-total-stars');
    if (starsEl) starsEl.textContent = `⭐ ${totalStars}`;
  }
}
