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
    panel.className = 'auth-panel auth-panel--compact';
    panel.innerHTML = `
      <button class="btn secondary auth-open-btn" id="authOpenBtn" type="button">Войти</button>

      <div class="auth-user-pill" id="authUserPill" style="display:none;">
        <span class="auth-user-dot"></span>
        <span class="auth-user-email" id="authUserEmail">вошёл</span>
        <button class="auth-ghost-btn" id="signOutBtn" type="button">Выйти</button>
      </div>

      <span class="auth-status" id="authStatus">локально</span>
    `;

    topActions.prepend(panel);

    if (!byId('authModal')) {
      const modal = document.createElement('div');
      modal.id = 'authModal';
      modal.className = 'auth-modal';
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML = `
        <div class="auth-backdrop" id="authBackdrop"></div>

        <section class="auth-card" role="dialog" aria-modal="true" aria-labelledby="authTitle">
          <button class="auth-close" id="authCloseBtn" type="button" aria-label="Закрыть окно входа">×</button>

          <div class="auth-kicker">облачное сохранение</div>
          <h2 id="authTitle">Вход в рейс</h2>
          <p class="auth-copy">
            Войди, чтобы прогресс сохранялся не только в браузере, но и в Supabase.
          </p>

          <label class="auth-field">
            <span>Email</span>
            <input class="auth-input" id="authEmail" type="email" placeholder="mail@example.com" autocomplete="email">
          </label>

          <label class="auth-field">
            <span>Пароль</span>
            <input class="auth-input" id="authPassword" type="password" placeholder="минимум 6 символов" autocomplete="current-password">
          </label>

          <div class="auth-message" id="authMessage">
            Можно продолжать локально — вход нужен только для облачного сохранения.
          </div>

          <div class="auth-actions">
            <button class="btn primary" id="signInBtn" type="button">Войти</button>
            <button class="btn secondary" id="signUpBtn" type="button">Создать аккаунт</button>
          </div>
        </section>
      `;

      document.body.appendChild(modal);
    }
  }

  function openAuthModal() {
    const modal = byId('authModal');
    if (!modal) return;

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');

    const message = byId('authMessage');
    if (message) {
      message.classList.remove('is-error');
      message.textContent = 'Можно продолжать локально — вход нужен только для облачного сохранения.';
    }

    setTimeout(() => byId('authEmail')?.focus(), 60);
  }

  function closeAuthModal() {
    const modal = byId('authModal');
    if (!modal) return;

    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }

  function setStatus(text) {
    const status = byId('authStatus');

    if (status) {
      status.textContent = currentUser ? 'облако' : (hasConfig ? 'локально' : 'нет конфигурации');
    }

    const message = byId('authMessage');
    if (message && text) {
      message.textContent = text;
      message.classList.remove('is-error');
    }
  }

  function setError(text) {
    const message = byId('authMessage');
    if (!message) return;

    message.textContent = text;
    message.classList.add('is-error');
  }

  function setInfo(text) {
    const message = byId('authMessage');
    if (!message) return;

    message.textContent = text;
    message.classList.remove('is-error');
  }

  function updateAuthUI() {
    const openBtn = byId('authOpenBtn');
    const userPill = byId('authUserPill');
    const userEmail = byId('authUserEmail');

    if (!openBtn || !userPill || !userEmail) return;

    if (currentUser) {
      openBtn.style.display = 'none';
      userPill.style.display = 'inline-flex';
      userEmail.textContent = currentUser.email || 'вошёл';
      setStatus('Облачное сохранение включено');
    } else {
      openBtn.style.display = '';
      userPill.style.display = 'none';
      userEmail.textContent = '';
      setStatus(hasConfig
        ? 'Можно продолжать локально — вход нужен только для облачного сохранения.'
        : 'Supabase не настроен: проверь src/supabase-config.js'
      );
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
      setInfo('Создаём аккаунт...');
      const { email, password } = getAuthValues();

      const { data, error } = await client.auth.signUp({
        email,
        password
      });

      if (error) throw error;

      currentUser = data.user || null;
      updateAuthUI();

      if (currentUser) {
        setInfo('Аккаунт создан. Загружаю облачный прогресс...');
        await loadCloudProgress();
        closeAuthModal();
      } else {
        setInfo('Аккаунт создан. Проверь почту для подтверждения входа.');
      }
    } catch (error) {
      console.warn(error);
      setError(error.message || 'Ошибка регистрации');
    }
  }

  async function signIn() {
    if (!client) return;

    try {
      setInfo('Входим...');
      const { email, password } = getAuthValues();

      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      currentUser = data.user || null;
      updateAuthUI();
      await loadCloudProgress();
      closeAuthModal();
    } catch (error) {
      console.warn(error);
      setError(error.message || 'Ошибка входа');
    }
  }

  async function signOut() {
    if (!client) return;

    const { error } = await client.auth.signOut();

    if (error) {
      console.warn('Ошибка выхода:', error.message);
      setError('Ошибка выхода');
      return;
    }

    currentUser = null;
    updateAuthUI();
    setInfo('Можно продолжать локально — вход нужен только для облачного сохранения.');
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
      setError('Не удалось загрузить облачный прогресс');
      return;
    }

    if (data?.state_json && typeof onLoadProgress === 'function') {
      onLoadProgress(data.state_json);
      setInfo('Облачный прогресс загружен');
    } else {
      setInfo('Облачное сохранение подключено. Пока сохранений нет.');
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
      setError('Ошибка сохранения прогресса');
      return;
    }

    setStatus('Сохранено в облаке');
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
      setError('Результат не сохранён');
      return;
    }

    setInfo('Результат сохранён в облаке');
  }

  async function init(options = {}) {
    onLoadProgress = options.onLoadProgress || null;

    injectAuthPanel();

    client = createClient();

    byId('authOpenBtn')?.addEventListener('click', openAuthModal);
    byId('authCloseBtn')?.addEventListener('click', closeAuthModal);
    byId('authBackdrop')?.addEventListener('click', closeAuthModal);

    byId('signUpBtn')?.addEventListener('click', signUp);
    byId('signInBtn')?.addEventListener('click', signIn);
    byId('signOutBtn')?.addEventListener('click', signOut);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeAuthModal();
    });

    byId('authPassword')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') signIn();
    });

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
