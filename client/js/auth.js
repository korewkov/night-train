import { api, setToken, getToken } from './api.js';
import { toast } from './ui.js';

let currentUser = null;
let isGuest = false;

export function getCurrentUser() { return currentUser; }
export function isGuestMode() { return isGuest; }
export function isAuthenticated() { return !!currentUser && !isGuest; }

export async function tryAutoLogin() {
  const token = getToken();
  if (!token) return null;
  try {
    const { user } = await api.me();
    currentUser = user;
    return user;
  } catch {
    setToken(null);
    return null;
  }
}

export async function login(loginValue, password) {
  const { token, user } = await api.login(loginValue, password);
  setToken(token);
  currentUser = user;
  isGuest = false;
  toast('Добро пожаловать обратно!', 'success');
  return user;
}

export async function register(username, email, password) {
  const { token, user } = await api.register(username, email, password);
  setToken(token);
  currentUser = user;
  isGuest = false;
  toast('Аккаунт создан!', 'success');
  return user;
}

export function logout() {
  setToken(null);
  currentUser = null;
  isGuest = false;
}

export function enterGuestMode() {
  currentUser = { username: 'Гость' };
  isGuest = true;
}