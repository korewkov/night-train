(function () {
  'use strict';

  const config = window.SUPABASE_CONFIG || {};
  let client = null;
  let currentUser = null;
  let isAdmin = false;

  function byId(id) {
    return document.getElementById(id);
  }

  function createClient() {
    if (!window.supabase || !config.url || !config.anonKey) return null;
    return window.supabase.createClient(config.url, config.anonKey);
  }

  function injectAdminUI() {
    const topActions = document.querySelector('.top-actions');
    if (!topActions || byId('adminResultsBtn')) return;

    const btn = document.createElement('button');
    btn.className = 'btn secondary admin-results-btn';
    btn.id = 'adminResultsBtn';
    btn.type = 'button';
    btn.textContent = 'Результаты';
    btn.style.display = 'none';

    topActions.prepend(btn);

    const modal = document.createElement('div');
    modal.id = 'adminModal';
    modal.className = 'admin-modal';
    modal.setAttribute('aria-hidden', 'true');

    modal.innerHTML = `
      <div class="admin-backdrop" id="adminBackdrop"></div>

      <section class="admin-card" role="dialog" aria-modal="true" aria-labelledby="adminTitle">
        <button class="admin-close" id="adminCloseBtn" type="button" aria-label="Закрыть результаты">×</button>

        <div class="admin-kicker">панель организатора</div>
        <h2 id="adminTitle">Результаты прохождений</h2>
        <p class="admin-copy">
          Здесь отображаются финалы и ключевые показатели игроков, которые вошли в аккаунт.
        </p>

        <div class="admin-toolbar">
          <button class="btn primary" id="adminReloadBtn" type="button">Обновить</button>
          <div class="admin-status" id="adminStatus">ожидание</div>
        </div>

        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Финал</th>
                <th>Совесть</th>
                <th>Смелость</th>
                <th>Эмпатия</th>
                <th>Маша</th>
                <th>Кризис</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody id="adminResultsBody">
              <tr>
                <td colspan="8">Данные ещё не загружены</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    `;

    document.body.appendChild(modal);

    btn.addEventListener('click', openAdminModal);
    byId('adminCloseBtn')?.addEventListener('click', closeAdminModal);
    byId('adminBackdrop')?.addEventListener('click', closeAdminModal);
    byId('adminReloadBtn')?.addEventListener('click', loadResults);
  }

  function setStatus(text) {
    const el = byId('adminStatus');
    if (el) el.textContent = text;
  }

  function openAdminModal() {
    const modal = byId('adminModal');
    if (!modal) return;

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');

    loadResults();
  }

  function closeAdminModal() {
    const modal = byId('adminModal');
    if (!modal) return;

    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }

  function endingLabel(type) {
    const labels = {
      provodnik: 'Проводник',
      vtoroy_shans: 'Следующий рейс',
      po_raspisaniyu: 'По расписанию',
      ne_dopushen: 'Не допущен',
      oboydetsya: 'Обойдётся'
    };

    return labels[type] || type || '—';
  }

  function boolLabel(value) {
    return value ? 'да' : 'нет';
  }

  function formatDate(value) {
    if (!value) return '—';

    try {
      return new Date(value).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return value;
    }
  }

  async function checkAdminStatus() {
    if (!client || !currentUser) {
      isAdmin = false;
      updateAdminButton();
      return;
    }

    const { data, error } = await client
      .from('admin_users')
      .select('user_id')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (error) {
      console.warn('Ошибка проверки админа:', error.message);
      isAdmin = false;
      updateAdminButton();
      return;
    }

    isAdmin = Boolean(data);
    updateAdminButton();
  }

  function updateAdminButton() {
    const btn = byId('adminResultsBtn');
    if (!btn) return;

    btn.style.display = isAdmin ? '' : 'none';
  }

  async function loadResults() {
    if (!client || !isAdmin) return;

    setStatus('загрузка...');

    const { data, error } = await client
      .from('game_results')
      .select(`
        user_email,
        ending_type,
        conscience,
        courage,
        empathy,
        masha_document_fixed,
        fatal_document_violation,
        crisis_resolved,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    const body = byId('adminResultsBody');
    if (!body) return;

    if (error) {
      console.warn('Ошибка загрузки результатов:', error.message);
      setStatus('ошибка загрузки');
      body.innerHTML = `<tr><td colspan="8">Ошибка загрузки результатов</td></tr>`;
      return;
    }

    if (!data || !data.length) {
      setStatus('пусто');
      body.innerHTML = `<tr><td colspan="8">Пока нет результатов</td></tr>`;
      return;
    }

    body.innerHTML = data.map((row) => {
      const mashaStatus = row.fatal_document_violation
        ? 'фатальная'
        : row.masha_document_fixed
          ? 'исправлена'
          : 'нет';

      return `
        <tr>
          <td>${row.user_email || '—'}</td>
          <td>${endingLabel(row.ending_type)}</td>
          <td>${row.conscience ?? 0}</td>
          <td>${row.courage ?? 0}</td>
          <td>${row.empathy ?? 0}</td>
          <td>${mashaStatus}</td>
          <td>${boolLabel(row.crisis_resolved)}</td>
          <td>${formatDate(row.created_at)}</td>
        </tr>
      `;
    }).join('');

    setStatus(`загружено: ${data.length}`);
  }

  async function refreshUser() {
    if (!client) return;

    const { data } = await client.auth.getSession();
    currentUser = data.session?.user || null;

    await checkAdminStatus();
  }

  async function init() {
    injectAdminUI();

    client = createClient();

    if (!client) {
      updateAdminButton();
      return;
    }

    await refreshUser();

    client.auth.onAuthStateChange(async (_event, session) => {
      currentUser = session?.user || null;
      await checkAdminStatus();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeAdminModal();
    });
  }

  window.NightTrainAdmin = {
    init,
    loadResults
  };
})();
