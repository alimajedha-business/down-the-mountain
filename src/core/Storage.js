// LocalStorage Persistence Layer

const STORAGE_KEYS = {
  HIGH_SCORE: 'dtm_high_score',
  TOTAL_STARS: 'dtm_total_stars',
  SOUND_ENABLED: 'dtm_sound_enabled'
};

export class Storage {
  static getHighScore() {
    try {
      return parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE) || '0', 10);
    } catch {
      return 0;
    }
  }

  static setHighScore(val) {
    try {
      localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, val.toString());
    } catch (e) {
      console.warn('Storage write failed', e);
    }
  }

  static getTotalStars() {
    try {
      return parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_STARS) || '0', 10);
    } catch {
      return 0;
    }
  }

  static setTotalStars(val) {
    try {
      localStorage.setItem(STORAGE_KEYS.TOTAL_STARS, val.toString());
    } catch (e) {
      console.warn('Storage write failed', e);
    }
  }

  static addStars(amount) {
    const current = this.getTotalStars();
    const updated = Math.max(0, current + amount);
    this.setTotalStars(updated);
    return updated;
  }

  static isSoundEnabled() {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
      return val === null ? true : val === 'true';
    } catch {
      return true;
    }
  }

  static setSoundEnabled(enabled) {
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, enabled ? 'true' : 'false');
    } catch (e) {
      console.warn('Storage write failed', e);
    }
  }
}
