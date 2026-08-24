// User Input Manager (Touch split, Keyboard, Mouse, Gamepad)

export class InputManager {
  constructor(options = {}) {
    this.onMoveLeft = options.onMoveLeft || (() => {});
    this.onMoveRight = options.onMoveRight || (() => {});
    this.onPause = options.onPause || (() => {});
    this.onAction = options.onAction || (() => {});

    this.enabled = true;
    this.touchStartX = 0;
    this.touchStartY = 0;

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

    // Touch swipe fallback on canvas container
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer) {
      canvasContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          this.touchStartX = e.touches[0].clientX;
          this.touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      canvasContainer.addEventListener('touchend', (e) => {
        if (e.changedTouches.length > 0) {
          const deltaX = e.changedTouches[0].clientX - this.touchStartX;
          const deltaY = e.changedTouches[0].clientY - this.touchStartY;

          // If quick swipe horizontally
          if (Math.abs(deltaX) > 30 && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX < 0) {
              if (this.enabled) this.onMoveLeft();
            } else {
              if (this.enabled) this.onMoveRight();
            }
          }
        }
      }, { passive: true });
    }
  }
}
