(function () {
  'use strict';

  const config = window.SUPABASE_CONFIG || {};
  const hasConfig =
    config.url &&
    config.anonKey &&
    !config.url.includes('ВСТАВЬ') &&
    !config.anonKey.includes('ВСТАВЬ');

  let client = null;
  let currentUser = null;
  let saveTimer = null;
  let onLoadProgress = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function createClient() {
    if (!hasConfig) {
      console.warn('Supabase не настроен: проверь src/supabase-config.js');
      return null;
    }

    if (!window.supabase) {
      console.warn('Supabase SDK не загрузился');
      return null;
    }

    return window.supabase.createClient(config.url, config.anonKey);
  }

  function injectAuthPanel() {
    const topActions = document.querySelector('.top-actions');
    if (!topActions || byId('authPanel')) return;

    const panel = document.createElement('div');
    panel.id = 'authPanel';
    panel.className = 'auth-panel';
    panel.innerHTML = `
      <input class="auth-input" id="authEmail" type="email" placeholder="email" autocomplete="email">
      <input class="auth-input" id="authPassword" type="password" placeholder="пароль" autocomplete="current-password">
      <button class="btn secondary" id="signInBtn" type="button">Войти</button>
      <button class="btn secondary" id="signUpBtn" type="button">Регистрация</button>
      <button class="btn secondary" id="signOutBtn" type="button" style="display:none;">Выйти</button>
      <span class="auth-status" id="authStatus">локально</span>
    `;

    topActions.prepend(panel);
  }

  function setStatus(text) {
    const el = byId('authStatus');
    if (el) el.textContent = text;
  }

  function updateAuthUI() {
    const email = byId('authEmail');
    const password = byId('authPassword');
    const signIn = byId('signInBtn');
    const signUp = byId('signUpBtn');
    const signOut = byId('signOutBtn');

    if (!email || !password || !signIn || !signUp || !signOut) return;

    if (currentUser) {
      email.style.display = 'none';
      password.style.display = 'none';
      signIn.style.display = 'none';
      signUp.style.display = 'none';
      signOut.style.display = '';
      setStatus(currentUser.email || 'вошёл');
    } else {
      email.style.display = '';
      password.style.display = '';
      signIn.style.display = '';
      signUp.style.display = '';
      signOut.style.display = 'none';
      setStatus(hasConfig ? 'локально' : 'Supabase не настроен');
    }
  }

  async function getSessionUser() {
    if (!client) return null;

    const { data, error } = await client.auth.getSession();

    if (error) {
      console.warn('Ошибка получения сессии:', error.message);
      return null;
    }

    return data.session?.user || null;
  }

  function getAuthValues() {
    const email = byId('authEmail')?.value.trim();
    const password = byId('authPassword')?.value;

    if (!email || !password) {
      throw new Error('Введите email и пароль');
    }

    if (password.length < 6) {
      throw new Error('Пароль должен быть минимум 6 символов');
    }

    return { email, password };
  }

  async function signUp() {
    if (!client) return;

    try {
      const { email, password } = getAuthValues();

      const { data, error } = await client.auth.signUp({
        email,
        password
      });

      if (error) throw error;

      currentUser = data.user || null;
      updateAuthUI();

      if (currentUser) {
        setStatus('зарегистрирован');
        await loadCloudProgress();
      } else {
        setStatus('проверь почту');
      }
    } catch (error) {
      console.warn(error);
      setStatus(error.message || 'ошибка регистрации');
    }
  }

  async function signIn() {
    if (!client) return;

    try {
      const { email, password } = getAuthValues();

      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      currentUser = data.user || null;
      updateAuthUI();
      await loadCloudProgress();
    } catch (error) {
      console.warn(error);
      setStatus(error.message || 'ошибка входа');
    }
  }

  async function signOut() {
    if (!client) return;

    const { error } = await client.auth.signOut();

    if (error) {
      console.warn('Ошибка выхода:', error.message);
      setStatus('ошибка выхода');
      return;
    }

    currentUser = null;
    updateAuthUI();
    setStatus('локально');
  }

  async function loadCloudProgress() {
    if (!client || !currentUser) return;

    const { data, error } = await client
      .from('game_progress')
      .select('state_json, updated_at')
      .eq('user_id', currentUser.id)
      .eq('story_id', 'story-01')
      .maybeSingle();

    if (error) {
      console.warn('Ошибка загрузки прогресса:', error.message);
      setStatus('ошибка загрузки');
      return;
    }

    if (data?.state_json && typeof onLoadProgress === 'function') {
      onLoadProgress(data.state_json);
      setStatus('прогресс загружен');
    } else {
      setStatus('облако пустое');
    }
  }

  async function saveProgress(storyId, state) {
    if (!client || !currentUser || !state) return;

    const { error } = await client
      .from('game_progress')
      .upsert(
        {
          user_id: currentUser.id,
          story_id: storyId,
          state_json: state,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,story_id'
        }
      );

    if (error) {
      console.warn('Ошибка сохранения прогресса:', error.message);
      setStatus('ошибка сохранения');
      return;
    }

    setStatus('сохранено');
  }

  function queueSave(storyId, state) {
    if (!currentUser) return;

    clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
      saveProgress(storyId, state);
    }, 600);
  }

  async function saveResult(storyId, endingType, state) {
    if (!client || !currentUser || !endingType || !state) return;

    const { error } = await client
      .from('game_results')
      .insert({
        user_id: currentUser.id,
        story_id: storyId,
        ending_type: endingType,
        state_json: state
      });

    if (error) {
      console.warn('Ошибка сохранения результата:', error.message);
      setStatus('результат не сохранён');
      return;
    }

    setStatus('результат сохранён');
  }

  async function init(options = {}) {
    onLoadProgress = options.onLoadProgress || null;

    injectAuthPanel();

    client = createClient();

    byId('signUpBtn')?.addEventListener('click', signUp);
    byId('signInBtn')?.addEventListener('click', signIn);
    byId('signOutBtn')?.addEventListener('click', signOut);

    if (!client) {
      updateAuthUI();
      return;
    }

    currentUser = await getSessionUser();
    updateAuthUI();

    if (currentUser) {
      await loadCloudProgress();
    }

    client.auth.onAuthStateChange(async (_event, session) => {
      currentUser = session?.user || null;
      updateAuthUI();
    });
  }

  window.NightTrainCloud = {
    init,
    queueSave,
    saveResult,
    loadCloudProgress,
    getUser: () => currentUser
  };
})();
