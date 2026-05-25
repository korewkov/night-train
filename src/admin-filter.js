(function () {
  'use strict';

  const config = window.SUPABASE_CONFIG || {};
  const stories = window.GameData?.STORY_LIBRARY || [{ id: 'story-01', title: 'Ночной рейс' }];
  let client = null;
  let selectedStoryId = 'all';
  let isReady = false;

  function byId(id) {
    return document.getElementById(id);
  }

  function createClient() {
    if (!window.supabase || !config.url || !config.anonKey) return null;
    return window.supabase.createClient(config.url, config.anonKey);
  }

  function storyTitle(storyId) {
    if (!storyId || storyId === 'all') return 'Все истории';
    const story = stories.find((item) => item.id === storyId);
    return story?.title || storyId;
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
    if (type === 'provodnik') return 'good';
    if (type === 'vtoroy_shans') return 'ok';
    if (type === 'ne_dopushen' || type === 'oboydetsya') return 'bad';
    return 'mid';
  }

  function percent(value, total) {
    return total ? Math.round((value / total) * 100) : 0;
  }

  function avg(rows, key) {
    if (!rows.length) return 0;
    return Number((rows.reduce((sum, row) => sum + Number(row[key] || 0), 0) / rows.length).toFixed(1));
  }

  function uniqueCount(rows, key) {
    return new Set(rows.map((row) => row[key]).filter(Boolean)).size;
  }

  function countBy(rows, key) {
    return rows.reduce((acc, row) => {
      const value = row[key] || 'unknown';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  function metric(label, value, caption) {
    return '<article class="admin-metric-card"><div class="admin-metric-label">' + label + '</div><div class="admin-metric-value">' + value + '</div><div class="admin-metric-caption">' + caption + '</div></article>';
  }

  function progress(label, value, caption) {
    const width = Math.max(0, Math.min(100, Math.round(((Number(value) + 5) / 13) * 100)));
    return '<div class="admin-progress-row"><div class="admin-progress-head"><span>' + label + '</span><b>' + value + '</b></div><div class="admin-progress-track"><span style="width:' + width + '%"></span></div><div class="admin-progress-caption">' + caption + '</div></div>';
  }

  function endingBar(type, count, total) {
    const value = percent(count, total);
    return '<div class="admin-ending-row ' + endingTone(type) + '"><div class="admin-ending-head"><span>' + endingLabel(type) + '</span><b>' + count + '</b></div><div class="admin-ending-track"><span style="width:' + value + '%"></span></div><div class="admin-ending-percent">' + value + '%</div></div>';
  }

  function risk(label, count, total, caption) {
    const value = percent(count, total);
    return '<article class="admin-risk-card"><div class="admin-risk-top"><span>' + label + '</span><b>' + value + '%</b></div><div class="admin-risk-track"><span style="width:' + value + '%"></span></div><div class="admin-risk-caption">' + count + ' из ' + total + ' · ' + caption + '</div></article>';
  }

  function render(rows) {
    const dashboard = byId('adminDashboard');
    if (!dashboard) return;

    if (!rows.length) {
      dashboard.innerHTML = '<div class="admin-empty-state">Пока нет результатов: ' + storyTitle(selectedStoryId) + '</div>';
      return;
    }

    const total = rows.length;
    const users = uniqueCount(rows, 'user_email');
    const endings = countBy(rows, 'ending_type');
    const endingEntries = Object.entries(endings).sort((a, b) => b[1] - a[1]);
    const dominant = endingEntries[0]?.[0] || '—';
    const success = rows.filter((row) => row.ending_type === 'provodnik' || row.ending_type === 'vtoroy_shans').length;
    const fail = rows.filter((row) => row.ending_type === 'ne_dopushen' || row.ending_type === 'oboydetsya').length;
    const fatalMasha = rows.filter((row) => row.fatal_document_violation).length;
    const fixedMasha = rows.filter((row) => row.masha_document_fixed).length;
    const crisis = rows.filter((row) => row.crisis_resolved).length;

    const endingOrder = ['provodnik', 'vtoroy_shans', 'po_raspisaniyu', 'ne_dopushen', 'oboydetsya'];
    const bars = endingOrder.filter((type) => endings[type]).map((type) => endingBar(type, endings[type], total)).join('');

    const recent = rows.slice(0, 6).map((row) => {
      return '<div class="admin-recent-item ' + endingTone(row.ending_type) + '"><div><b>' + (row.user_email || 'без email') + '</b><span>' + storyTitle(row.story_id) + ' · ' + endingLabel(row.ending_type) + '</span></div><strong>' + (row.conscience ?? 0) + '/' + (row.courage ?? 0) + '/' + (row.empathy ?? 0) + '</strong></div>';
    }).join('');

    dashboard.innerHTML =
      '<section class="admin-metrics-grid">' +
        metric('Прохождений', total, 'фильтр: ' + storyTitle(selectedStoryId)) +
        metric('Игроков', users, 'уникальные email') +
        metric('Успешных финалов', percent(success, total) + '%', success + ' из ' + total) +
        metric('Частый финал', endingLabel(dominant), 'самый массовый исход') +
      '</section>' +
      '<section class="admin-dashboard-grid">' +
        '<article class="admin-panel admin-panel-large"><div class="admin-panel-head"><h3>Распределение финалов</h3><span>' + fail + ' критических исходов</span></div><div class="admin-ending-bars">' + bars + '</div></article>' +
        '<article class="admin-panel"><div class="admin-panel-head"><h3>Средний профиль</h3><span>моральные параметры</span></div><div class="admin-progress-list">' +
          progress('Совесть', avg(rows, 'conscience'), 'готовность признать ответственность') +
          progress('Смелость', avg(rows, 'courage'), 'действия в конфликте') +
          progress('Эмпатия', avg(rows, 'empathy'), 'человечность в рейсе') +
        '</div></article>' +
        '<article class="admin-panel admin-panel-large"><div class="admin-panel-head"><h3>Проблемные зоны</h3><span>где игроки чаще ошибаются</span></div><div class="admin-risk-grid">' +
          risk('Фатальная ошибка Маши', fatalMasha, total, 'документ не исправлен') +
          risk('Документы исправлены', fixedMasha, total, 'выбрали Нину Павловну') +
          risk('Кризис решён', crisis, total, 'не ушли от финальной ситуации') +
        '</div></article>' +
        '<article class="admin-panel"><div class="admin-panel-head"><h3>Последние прохождения</h3><span>история · email · финал</span></div><div class="admin-recent-list">' + recent + '</div></article>' +
      '</section>';
  }

  async function isAdminUser(userId) {
    if (!client || !userId) return false;
    const { data } = await client.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle();
    return Boolean(data);
  }

  async function loadFilteredResults() {
    if (!client) return;

    const status = byId('adminStatus');
    if (status) status.textContent = 'загрузка...';

    const sessionResult = await client.auth.getSession();
    const user = sessionResult.data.session?.user || null;
    const admin = await isAdminUser(user?.id);
    if (!admin) return;

    let query = client
      .from('game_results')
      .select('story_id,user_email,ending_type,conscience,courage,empathy,masha_document_fixed,fatal_document_violation,crisis_resolved,created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (selectedStoryId !== 'all') {
      query = query.eq('story_id', selectedStoryId);
    }

    const { data, error } = await query;

    if (error) {
      if (status) status.textContent = 'ошибка загрузки';
      const dashboard = byId('adminDashboard');
      if (dashboard) dashboard.innerHTML = '<div class="admin-empty-state">Ошибка загрузки результатов</div>';
      return;
    }

    render(data || []);
    if (status) status.textContent = 'загружено: ' + (data || []).length;
  }

  function injectFilter() {
    if (byId('adminStoryFilter')) return true;

    const toolbar = document.querySelector('.admin-toolbar');
    if (!toolbar) return false;

    const wrapper = document.createElement('label');
    wrapper.className = 'admin-story-filter';
    wrapper.innerHTML = '<span>История</span><select id="adminStoryFilter"><option value="all">Все истории</option>' + stories.map((story) => '<option value="' + story.id + '">' + (story.title || story.id) + '</option>').join('') + '</select>';

    const reload = byId('adminReloadBtn');
    if (reload) {
      reload.insertAdjacentElement('afterend', wrapper);
      reload.addEventListener('click', () => setTimeout(loadFilteredResults, 80));
    } else {
      toolbar.prepend(wrapper);
    }

    byId('adminStoryFilter')?.addEventListener('change', (event) => {
      selectedStoryId = event.target.value || 'all';
      loadFilteredResults();
    });

    return true;
  }

  function init() {
    client = createClient();

    const timer = setInterval(() => {
      if (injectFilter()) {
        clearInterval(timer);
        isReady = true;
      }
    }, 300);

    const observer = new MutationObserver(() => {
      const modal = byId('adminModal');
      if (modal?.classList.contains('show')) {
        injectFilter();
        setTimeout(loadFilteredResults, 120);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
