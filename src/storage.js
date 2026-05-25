'use strict';

window.GameStorage = {
  load(key, fallbackState) {
    try {
      const savedRaw = localStorage.getItem(key);
      if (!savedRaw) return fallbackState;

      const saved = JSON.parse(savedRaw);
      return saved ? { ...fallbackState, ...saved } : fallbackState;
    } catch (error) {
      console.warn('Не удалось загрузить сохранение:', error);
      return fallbackState;
    }
  },

  save(key, state) {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn('Не удалось сохранить прогресс:', error);
    }
  },

  reset(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Не удалось сбросить сохранение:', error);
    }
  }
};
