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

      <section class="admin-card admin-dashboard-card" role="dialog" aria-modal="true" aria-labelledby="adminTitle">
        <button class="admin-close" id="adminCloseBtn" type="button" aria-label="Закрыть результаты">×</button>

        <div class="admin-kicker">панель организатора</div>
        <h2 id="adminTitle">Итоги рейсов</h2>
        <p class="admin-copy">
          Сводка по прохождениям: финалы, средние показатели и проблемные зоны.
        </p>

        <div class="admin-toolbar">
          <button class="btn primary" id="adminReloadBtn" type="button">Обновить</button>
          <div class="admin-status" id="adminStatus">ожидание</div>
        </div>

        <div class="admin-dashboard" id="adminDashboard">
          <div class="admin-empty-state">Данные ещё не загружены</div>
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

  function endingTone(type) {
    const tones = {
      provodnik: 'good',
      vtoroy_shans: 'ok',
      po_raspisaniyu: 'mid',
      ne_dopushen: 'bad',
      oboydetsya: 'bad'
    };

    return tones[type] || 'mid';
  }

  function percent(value, total) {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  }

  function avg(rows, key) {
    if (!rows.length) return 0;
    const sum = rows.reduce((acc, row) => acc + Number(row[key] || 0), 0);
    return Number((sum / rows.length).toFixed(1));
  }

  function uniqueCount(rows, key) {
    return new Set(rows.map((row) => row[key]).filter(Boolean)).size;
  }

  function getEndingCounts(rows) {
    return rows.reduce((acc, row) => {
      const key = row.ending_type || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  function getDominantEnding(rows) {
    const counts = getEndingCounts(rows);
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return entries[0]?.[0] || '—';
  }

  function metricCard(label, value, caption) {
    return `
      <article class="admin-metric-card">
        <div class="admin-metric-label">${label}</div>
        <div class="admin-metric-value">${value}</div>
        <div class="admin-metric-caption">${caption}</div>
      </article>
    `;
  }

  function progressBar(label, value, maxValue, caption) {
    const normalized = Math.max(0, Math.min(100, Math.round(((value + 5) / (maxValue + 5)) * 100)));

    return `
      <div class="admin-progress-row">
        <div class="admin-progress-head">
          <span>${label}</span>
          <b>${value}</b>
        </div>
        <div class="admin-progress-track">
          <span style="width:${normalized}%"></span>
        </div>
        <div class="admin-progress-caption">${caption}</div>
      </div>
    `;
  }

  function endingBar(type, count, total) {
    const value = percent(count, total);

    return `
      <div class="admin-ending-row ${endingTone(type)}">
        <div class="admin-ending-head">
          <span>${endingLabel(type)}</span>
          <b>${count}</b>
        </div>
        <div class="admin-ending-track">
          <span style="width:${value}%"></span>
        </div>
        <div class="admin-ending-percent">${value}%</div>
      </div>
    `;
  }

  function riskCard(label, count, total, caption) {
    const value = percent(count, total);

    return `
      <article class="admin-risk-card">
        <div class="admin-risk-top">
          <span>${label}</span>
          <b>${value}%</b>
        </div>
        <div class="admin-risk-track">
          <span style="width:${value}%"></span>
        </div>
        <div class="admin-risk-caption">${count} из ${total} · ${caption}</div>
      </article>
    `;
  }

  function recentList(rows) {
    const latest = rows.slice(0, 6);

    return `
      <div class="admin-recent-list">
        ${latest.map((row) => `
          <div class="admin-recent-item ${endingTone(row.ending_type)}">
            <div>
              <b>${row.user_email || 'без email'}</b>
              <span>${endingLabel(row.ending_type)}</span>
            </div>
            <strong>${row.conscience ?? 0}/${row.courage ?? 0}/${row.empathy ?? 0}</strong>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderDashboard(rows) {
    const dashboard = byId('adminDashboard');
    if (!dashboard) return;

    if (!rows.length) {
      dashboard.innerHTML = `<div class="admin-empty-state">Пока нет результатов</div>`;
      return;
    }

    const total = rows.length;
    const users = uniqueCount(rows, 'user_email');
    const dominantEnding = getDominantEnding(rows);

    const successCount = rows.filter((row) => ['provodnik', 'vtoroy_shans'].includes(row.ending_type)).length;
    const failCount = rows.filter((row) => ['ne_dopushen', 'oboydetsya'].includes(row.ending_type)).length;

    const fatalMashaCount = rows.filter((row) => row.fatal_document_violation).length;
    const fixedMashaCount = rows.filter((row) => row.masha_document_fixed).length;
    const crisisResolvedCount = rows.filter((row) => row.crisis_resolved).length;

    const avgConscience = avg(rows, 'conscience');
    const avgCourage = avg(rows, 'courage');
    const avgEmpathy = avg(rows, 'empathy');

    const endingCounts = getEndingCounts(rows);
    const endingOrder = ['provodnik', 'vtoroy_shans', 'po_raspisaniyu', 'ne_dopushen', 'oboydetsya'];

    dashboard.innerHTML = `
      <section class="admin-metrics-grid">
        ${metricCard('Прохождений', total, 'последние 100 записей')}
        ${metricCard('Игроков', users, 'уникальные email')}
        ${metricCard('Успешных финалов', `${percent(successCount, total)}%`, `${successCount} из ${total}`)}
        ${metricCard('Частый финал', endingLabel(dominantEnding), 'самый массовый исход')}
      </section>

      <section class="admin-dashboard-grid">
        <article class="admin-panel admin-panel-large">
          <div class="admin-panel-head">
            <h3>Распределение финалов</h3>
            <span>${failCount} критических исходов</span>
          </div>

          <div class="admin-ending-bars">
            ${endingOrder
              .filter((type) => endingCounts[type])
              .map((type) => endingBar(type, endingCounts[type], total))
              .join('')}
          </div>
        </article>

        <article class="admin-panel">
          <div class="admin-panel-head">
            <h3>Средний профиль</h3>
            <span>моральные параметры</span>
          </div>

          <div class="admin-progress-list">
            ${progressBar('Совесть', avgConscience, 8, 'готовность признать ответственность')}
            ${progressBar('Смелость', avgCourage, 8, 'действия в конфликте')}
            ${progressBar('Эмпатия', avgEmpathy, 8, 'человечность в рейсе')}
          </div>
        </article>

        <article class="admin-panel admin-panel-large">
          <div class="admin-panel-head">
            <h3>Проблемные зоны</h3>
            <span>где игроки чаще ошибаются</span>
          </div>

          <div class="admin-risk-grid">
            ${riskCard('Фатальная ошибка Маши', fatalMashaCount, total, 'документ не исправлен')}
            ${riskCard('Документы исправлены', fixedMashaCount, total, 'выбрали Нину Павловну')}
            ${riskCard('Кризис решён', crisisResolvedCount, total, 'не ушли от финальной ситуации')}
          </div>
        </article>

        <article class="admin-panel">
          <div class="admin-panel-head">
            <h3>Последние прохождения</h3>
            <span>email · финал · параметры</span>
          </div>

          ${recentList(rows)}
        </article>
      </section>
    `;
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

    if (error) {
      console.warn('Ошибка загрузки результатов:', error.message);
      setStatus('ошибка загрузки');
      const dashboard = byId('adminDashboard');
      if (dashboard) dashboard.innerHTML = `<div class="admin-empty-state">Ошибка загрузки результатов</div>`;
      return;
    }

    renderDashboard(data || []);
    setStatus(`загружено: ${(data || []).length}`);
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
