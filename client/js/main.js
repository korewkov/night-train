import { showScreen, toast, openModal, closeModal } from './ui.js';
import { api } from './api.js';
import {
  login, register, logout, tryAutoLogin, enterGuestMode,
  getCurrentUser, isAuthenticated
} from './auth.js';

// === Инициализация ===
async function init() {
  bindAuthScreen();
  bindMenuScreen();
  bindGameScreen();
  bindStatsScreen();

  const user = await tryAutoLogin();
  if (user) goToMenu();
  else showScreen('screen-auth');
}

// === Экран авторизации ===
function bindAuthScreen() {
  const tabs = document.querySelectorAll('.tab');
  const forms = {
    login: document.getElementById('form-login'),
    register: document.getElementById('form-register')
  };
  const errorEl = document.getElementById('auth-error');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      Object.values(forms).forEach(f => f.classList.remove('active'));
      forms[tab.dataset.tab].classList.add('active');
      errorEl.textContent = '';
    });
  });

  forms.login.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    const fd = new FormData(e.target);
    try {
      await login(fd.get('login'), fd.get('password'));
      goToMenu();
    } catch (err) {
      errorEl.textContent = err.message || 'Ошибка входа';
    }
  });

  forms.register.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    const fd = new FormData(e.target);
    try {
      await register(fd.get('username'), fd.get('email'), fd.get('password'));
      goToMenu();
    } catch (err) {
      errorEl.textContent = err.message || 'Ошибка регистрации';
    }
  });

  document.getElementById('btn-guest').addEventListener('click', () => {
    enterGuestMode();
    goToMenu();
  });
}

// === Главное меню ===
function bindMenuScreen() {
  document.getElementById('btn-logout').addEventListener('click', () => {
    logout();
    showScreen('screen-auth');
  });

  document.getElementById('btn-new-game').addEventListener('click', () => {
    showScreen('screen-game');
    toast('Игра скоро будет 🚂 (заглушка из Части 2)', 'info');
  });

  document.getElementById('btn-load').addEventListener('click', async () => {
    if (!isAuthenticated()) {
      toast('Войдите в аккаунт, чтобы загрузить сохранение', 'error');
      return;
    }
    await renderSavesList();
    openModal('modal-saves');
  });

  document.getElementById('btn-continue').addEventListener('click', () => {
    toast('Продолжение появится после Части 3', 'info');
  });

  document.getElementById('btn-stats').addEventListener('click', async () => {
    showScreen('screen-stats');
    await renderStats();
  });
}

// === Экран игры (заглушка, наполним в Части 3) ===
function bindGameScreen() {
  document.getElementById('btn-back-menu').addEventListener('click', goToMenu);

  document.getElementById('btn-save').addEventListener('click', async () => {
    if (!isAuthenticated()) {
      toast('Сохранения доступны только зарегистрированным', 'error');
      return;
    }
    try {
      // Заглушка-сохранение: слот 1, начальная сцена
      await api.saveSlot(1, 'night-train', 'scene_intro', { hp: 100, items: [] });
      toast('Сохранено в слот 1', 'success');
    } catch (err) {
      toast(err.message || 'Не удалось сохранить', 'error');
    }
  });
}

// === Экран статистики ===
function bindStatsScreen() {
  document.getElementById('btn-stats-back').addEventListener('click', goToMenu);
}

async function renderStats() {
  const body = document.getElementById('stats-body');
  if (!isAuthenticated()) {
    body.innerHTML = '<p style="color: var(--text-muted)">Статистика доступна только зарегистрированным пользователям.</p>';
    return;
  }
  body.innerHTML = 'Загрузка...';
  try {
    const data = await api.getStats();
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:1rem;">
        <div>🎮 Прохождений: <b>${data.playthroughs ?? 0}</b></div>
        <div>🏆 Достижений: <b>${data.achievements?.length ?? 0}</b></div>
        <div>🎯 Концовок открыто: <b>${data.endings?.length ?? 0}</b></div>
      </div>
    `;
  } catch (err) {
    body.innerHTML = `<p style="color: var(--danger)">Ошибка: ${err.message}</p>`;
  }
}

// === Список сохранений ===
async function renderSavesList() {
  const listEl = document.getElementById('saves-list');
  listEl.innerHTML = 'Загрузка...';
  try {
    const { saves } = await api.getSaves();
    const slots = [1, 2, 3];
    listEl.innerHTML = slots.map(slot => {
      const save = saves.find(s => s.slot === slot);
      if (!save) {
        return `<div class="save-slot empty">Слот ${slot} — пусто</div>`;
      }
      const date = new Date(save.updatedAt).toLocaleString('ru-RU');
      return `
        <div class="save-slot" data-slot="${slot}">
          <div class="save-slot-info">
            <strong>Слот ${slot}</strong>
            <span class="save-slot-meta">${save.storyId} · ${save.sceneId}</span>
            <span class="save-slot-meta">${date}</span>
          </div>
          <button class="btn btn-ghost btn-small" data-delete="${slot}">🗑</button>
        </div>
      `;
    }).join('');

    // Загрузка по клику
    listEl.querySelectorAll('.save-slot[data-slot]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.matches('[data-delete]')) return;
        closeModal('modal-saves');
        showScreen('screen-game');
        toast(`Загружен слот ${el.dataset.slot} (логика в Части 3)`, 'info');
      });
    });

    // Удаление
    listEl.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const slot = btn.dataset.delete;
        if (!confirm(`Удалить сохранение в слоте ${slot}?`)) return;
        try {
          await api.deleteSave(slot);
          toast('Удалено', 'success');
          await renderSavesList();
        } catch (err) {
          toast(err.message || 'Ошибка', 'error');
        }
      });
    });
  } catch (err) {
    listEl.innerHTML = `<p style="color: var(--danger)">Ошибка: ${err.message}</p>`;
  }
}

// === Переходы ===
function goToMenu() {
  const user = getCurrentUser();
  document.getElementById('user-name').textContent = user?.username || 'Гость';
  showScreen('screen-menu');
}

// === Старт ===
init();