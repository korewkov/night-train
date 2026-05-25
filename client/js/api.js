// Базовый клиент для общения с бэкендом

const API_BASE = window.location.origin + '/api';

let authToken = localStorage.getItem('nt_token') || null;

export function setToken(token) {
  authToken = token;
  if (token) localStorage.setItem('nt_token', token);
  else localStorage.removeItem('nt_token');
}

export function getToken() {
  return authToken;
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.details = data.details;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  register: (username, email, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) }),
  login: (login, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ login, password }) }),
  me: () => request('/auth/me'),

  // Saves
  getSaves: () => request('/saves'),
  saveSlot: (slot, storyId, sceneId, state) =>
    request('/saves', { method: 'PUT', body: JSON.stringify({ slot, storyId, sceneId, state }) }),
  deleteSave: (slot) => request(`/saves/${slot}`, { method: 'DELETE' }),

  // Stats
  getStats: () => request('/stats/me'),
  savePlaythrough: (data) =>
    request('/stats/playthrough', { method: 'POST', body: JSON.stringify(data) }),
  unlockAchievement: (key) =>
    request('/stats/achievement', { method: 'POST', body: JSON.stringify({ key }) }),
  getLeaderboard: () => request('/stats/leaderboard'),

  health: () => request('/health'),
};