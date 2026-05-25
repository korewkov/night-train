// Локальное хранилище (для гостей и кеша)

const KEY_PREFIX = 'nt_';

export const storage = {
  get(key) {
    const raw = localStorage.getItem(KEY_PREFIX + key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },
  set(key, value) {
    localStorage.setItem(KEY_PREFIX + key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(KEY_PREFIX + key);
  }
};