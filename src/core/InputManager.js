// User Input Manager (Touch split, Keyboard, Mouse, Gamepad)

export class InputManager {
  constructor(options = {}) {
    this.onMoveLeft = options.onMoveLeft || (() => {});
    this.onMoveRight = options.onMoveRight || (() => {});
    this.onPause = options.onPause || (() => {});
    this.onAction = options.onAction || (() => {});

    this.enabled = true;

    this.initKeyboard();
    this.initTouch();
  }

  setEnabled(val) {
    this.enabled = val;
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Don't intercept if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyQ') {
        e.preventDefault();
        if (this.enabled) this.onMoveLeft();
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'KeyE') {
        e.preventDefault();
        if (this.enabled) this.onMoveRight();
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        this.onPause();
      } else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyR') {
        e.preventDefault();
        this.onAction(e.code);
      }
    });
  }

  initTouch() {
    const leftZone = document.getElementById('touch-left');
    const rightZone = document.getElementById('touch-right');

    const handleLeft = (e) => {
      e.preventDefault();
      if (this.enabled) this.onMoveLeft();
    };

    const handleRight = (e) => {
      e.preventDefault();
      if (this.enabled) this.onMoveRight();
    };

    if (leftZone) {
      leftZone.addEventListener('pointerdown', handleLeft);
    }
    if (rightZone) {
      rightZone.addEventListener('pointerdown', handleRight);
    }
  }
}
