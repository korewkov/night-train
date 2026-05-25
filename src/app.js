'use strict';
const {
  STORAGE_KEY,
  ACTIVE_STORY,
  SCENE_IMAGE_BASE_PATH,
  SCENE_IMAGE_EXTENSIONS,
  ROUTE_NAMES,
  STORY_LIBRARY,
  characters,
  scenes,
  SCENE_PHOTO_INDEX_BY_ID,
  ENDINGS
} = window.GameData;

    function defaultState() {
      return {
        sceneId: 'prologue', selected: {}, debuffs: [], storyPath: [],
        conscience: 0, courage: 0, empathy: 0, discipline: 0, trustPassengers: 0,
        ilyaTrust: 0, mashaTrust: 0, olegTrust: 0,
        helpedIlya: false, alienatedIlya: false, mashaDocumentFixed: false, mashaDocumentHidden: false, fatalDocumentViolation: false, betrayedMasha: false, pressuredMasha: false,
        ignoredOleg: false, humiliatedOleg: false, helpedMother: false, childDrawing: false, admittedMistake: false,
        crisisResolved: false, tragedyFlag: false, finished: false, gameOver: false, endingType: null
      };
    }

    let state = loadState();

    function loadState() {
  return GameStorage.load(STORAGE_KEY, defaultState());
}

  function save() {
  GameStorage.save(STORAGE_KEY, state);
}

    function clampMoral(value) { return Math.max(-5, Math.min(8, value)); }
    function moralPercent(value) { return Math.round(((clampMoral(value) + 5) / 13) * 100); }

    function getMoralColor() {
      const moral = (state.conscience || 0) + (state.empathy || 0) + (state.courage || 0);
      if (moral >= 4) return { color: '#22b573', soft: 'rgba(140,255,205,.92)', glow: 'rgba(34,181,115,.42)' };
      if (moral <= -3) return { color: '#d9364d', soft: 'rgba(255,152,152,.9)', glow: 'rgba(217,54,77,.42)' };
      return { color: '#f0b24c', soft: 'rgba(255,231,177,.9)', glow: 'rgba(240,178,76,.38)' };
    }

    function getStoryProgress(scene) {
      const route = Math.max(0, Math.min(ROUTE_NAMES.length - 1, scene.route || 0));
      const base = ((route + 1) / ROUTE_NAMES.length) * 100;
      const selectedBonus = state.selected[state.sceneId] !== undefined ? 1.5 : 0;
      return `${Math.min(100, Math.round(base + selectedBonus))}%`;
    }

    function pulseProgressBar() {
      const sceneEl = byId('scene');
      if (!sceneEl) return;
      sceneEl.classList.remove('progress-pulse');
      void sceneEl.offsetWidth;
      sceneEl.classList.add('progress-pulse');
      setTimeout(() => sceneEl.classList.remove('progress-pulse'), 260);
    }
    function byId(id) { return document.getElementById(id); }

    function getStoryCoverBasePath(storyId) {
      return `assets/images/covers/${storyId}/cover`;
    }

    function getStoryCoverCandidates(storyId) {
      return SCENE_IMAGE_EXTENSIONS.map(extension => `${getStoryCoverBasePath(storyId)}.${extension}`);
    }

    function setActiveNav(screenName) {
      const map = { menu: 'homeNavBtn', stories: 'storiesNavBtn', game: 'gameNavBtn' };
      ['homeNavBtn', 'storiesNavBtn', 'gameNavBtn'].forEach(id => byId(id)?.classList.remove('active'));
      byId(map[screenName])?.classList.add('active');
    }

    function showScreen(screenName) {
      ['menuScreen', 'storiesScreen', 'gameScreen'].forEach(id => byId(id)?.classList.add('hidden'));
      byId(`${screenName}Screen`)?.classList.remove('hidden');
      setActiveNav(screenName);
      const isGame = screenName === 'game';
      byId('restartBtn').style.display = isGame ? '' : 'none';
      byId('skipBtn').style.display = isGame ? '' : 'none';
    }

    function renderStoryCards() {
      const grid = byId('storiesGrid');
      if (!grid) return;
      grid.innerHTML = '';

      STORY_LIBRARY.forEach((story) => {
        const button = document.createElement('button');
        button.className = `story-card${story.active ? '' : ' locked'}`;
        button.type = 'button';
        button.disabled = !story.active;
        button.innerHTML = `
          <div class="story-cover" data-story-cover="${story.id}"></div>
          ${story.active ? '' : '<div class="lock-badge"><span>🔒</span></div>'}
          <div class="story-card-content">
            <div class="story-number">${story.number}</div>
            <h3 class="story-name">${story.title}</h3>
            <p class="story-description">${story.description}</p>
            <div class="story-status">${story.active ? 'доступно' : 'заблокировано'}</div>
          </div>
        `;
        if (story.active) button.addEventListener('click', () => openStory(story.id));
        grid.appendChild(button);
      });

      applyStoryCovers();
    }

    function applyStoryCovers() {
      document.querySelectorAll('[data-story-cover]').forEach((coverEl) => {
        const storyId = coverEl.dataset.storyCover;
        const fallback = 'radial-gradient(circle at 70% 20%, rgba(78,168,222,.20), transparent 30%), linear-gradient(135deg, rgba(26,56,92,.96), rgba(6,16,30,.98))';
        coverEl.style.backgroundImage = fallback;
        loadFirstExistingImage(
          getStoryCoverCandidates(storyId),
          (src) => { coverEl.style.backgroundImage = `url("${src}"), ${fallback}`; },
          () => { coverEl.style.backgroundImage = fallback; }
        );
      });
    }

    function openStory(storyId) {
      if (storyId !== ACTIVE_STORY) return;
      showScreen('game');
      render();
    }

    function toast(text) {
      const el = byId('toast');
      if (!el) return;
      el.textContent = text;
      el.classList.add('show');
      clearTimeout(toast.timer);
      toast.timer = setTimeout(() => el.classList.remove('show'), 2300);
    }

    function currentScene() {
      return scenes[state.sceneId] || scenes.prologue;
    }

    function getCrisisSceneId() {
  return window.GameLogic.getCrisisSceneId(state);
}

    function getEndingStats() {
  return window.GameLogic.getEndingStats(state);
}

    function getEnding() {
  return window.GameLogic.getEnding(state);
}

   function getRank() {
  return window.GameLogic.getRank(state);
}

    function applyEffects(effects = {}) {
      ['conscience','courage','empathy','discipline','trustPassengers','ilyaTrust','mashaTrust','olegTrust'].forEach(key => {
        if (typeof effects[key] === 'number') state[key] = clampMoral((state[key] || 0) + effects[key]);
      });
      ['helpedIlya','alienatedIlya','mashaDocumentFixed','mashaDocumentHidden','fatalDocumentViolation','betrayedMasha','pressuredMasha','ignoredOleg','humiliatedOleg','helpedMother','childDrawing','admittedMistake','crisisResolved','tragedyFlag'].forEach(key => {
        if (typeof effects[key] === 'boolean') state[key] = effects[key];
      });
      if (effects.debuff && !state.debuffs.includes(effects.debuff)) state.debuffs.push(effects.debuff);
      if (effects.path) state.storyPath.push(effects.path);
    }

    function render() {
      const scene = currentScene();
      const sceneEl = byId('scene');
      if (sceneEl) {
        const moralStyle = getMoralColor();
        sceneEl.style.setProperty('--scene-bg', scene.bg || 'linear-gradient(135deg, #102847, #07111f)');
        sceneEl.style.setProperty('--story-progress', getStoryProgress(scene));
        sceneEl.style.setProperty('--moral-color', moralStyle.color);
        sceneEl.style.setProperty('--moral-color-soft', moralStyle.soft);
        sceneEl.style.setProperty('--moral-glow', moralStyle.glow);
      }
      applyScenePhoto(scene);
      updateOverlayDensity(scene);
      const chapterLabel = byId('chapterLabel');
      if (chapterLabel) chapterLabel.textContent = scene.chapter;
      const locationInline = byId('speakerLocationInline');
      if (locationInline) locationInline.textContent = (scene.location || '').toUpperCase();
      const dialogue = getActiveDialogue(scene);
      const speakerName = dialogue[0] || 'Собеседник';
      renderCharacterCard(scene, speakerName);
      byId('dialogueText').textContent = dialogue[1] || '';
      renderChoices(scene);
      renderHud();
      renderDebuffs();
      save();
    }

    function getSpeakerRole(speakerName, scene) {
      const activeCharacter = characters[scene.character];
      if (activeCharacter && activeCharacter.name === speakerName) return activeCharacter.role || 'участник рейса';
      const found = Object.values(characters).find(item => item.name === speakerName);
      if (found) return found.role || 'участник рейса';
      return 'участник рейса';
    }

    function getActiveDialogue(scene) {
      const selected = state.selected[state.sceneId];
      const choice = scene.choices && selected !== undefined ? scene.choices[selected] : null;
      if (choice && Array.isArray(choice.afterDialogue)) return choice.afterDialogue;
      if (choice) return buildChoiceReaction(scene, choice);
      return scene.dialogue || ['Собеседник', '...'];
    }

    function buildChoiceReaction(scene, choice) {
      const speaker = scene.dialogue?.[0] || 'Собеседник';
      const title = choice.title || '';
      const result = choice.result || 'Решение принято.';

      if (choice.effects?.tragedyFlag) return ['Внутренний голос', 'В этот момент стало понятно: молчание тоже выбор. И иногда самый тяжёлый.'];
      if (choice.effects?.debuff) return [speaker, result];
      if (title.toLowerCase().includes('помочь') || title.toLowerCase().includes('поддержать') || title.toLowerCase().includes('извиниться')) return [speaker, 'Спасибо. Я не сразу понял, что вы делаете, но сейчас стало легче. В поезде очень важно, когда с тобой говорят как с человеком.'];
      if (title.toLowerCase().includes('отойти') || title.toLowerCase().includes('коридор') || title.toLowerCase().includes('просто выполнял')) return [speaker, 'Понял. Формально вы, наверное, правы. Просто от этого не становится менее стыдно и одиноко.'];
      if (title.toLowerCase().includes('резко') || title.toLowerCase().includes('жёстко') || title.toLowerCase().includes('грубо')) return [speaker, 'Можно было сказать это иначе. Я услышал не порядок, а то, что меня здесь хотят поскорее убрать.'];
      return [speaker, result];
    }

    function renderCharacterCard(scene, speakerName) {
      const baseCharacter = characters[scene.character] || characters.narrator;
      const activeCharacter = Object.values(characters).find(item => item.name === speakerName) || baseCharacter;
      const role = activeCharacter.role || 'участник рейса';

      byId('speakerName').textContent = speakerName || activeCharacter.name || 'Собеседник';
      byId('speakerRole').textContent = role.toUpperCase();
    }

    function getScenePhotoBasePath(scene) {
      const storyFolder = scene.story || ACTIVE_STORY;
      const fileNumber = String(scene.photoIndex || 1).padStart(2, '0');
      return `${SCENE_IMAGE_BASE_PATH}/${storyFolder}/${fileNumber}`;
    }

    function getScenePhotoPath(scene, extension = SCENE_IMAGE_EXTENSIONS[0]) {
      return `${getScenePhotoBasePath(scene)}.${extension}`;
    }

    function getScenePhotoCandidates(scene) {
      const baseCharacter = characters[scene.character] || characters.narrator;
      const manualImage = scene.photo || scene.image || scene.cardImage || baseCharacter.card || '';
      if (manualImage && manualImage.trim()) return [manualImage];
      return SCENE_IMAGE_EXTENSIONS.map(extension => getScenePhotoPath(scene, extension));
    }

    function loadFirstExistingImage(candidates, onSuccess, onError) {
      const [current, ...rest] = candidates;
      if (!current) {
        onError?.();
        return;
      }

      const img = new Image();
      img.onload = () => onSuccess(current);
      img.onerror = () => loadFirstExistingImage(rest, onSuccess, onError);
      img.src = current;
    }

    function applyScenePhoto(scene) {
      const imageEl = byId('characterCardImage');
      if (!imageEl) return;

      const fallback = 'radial-gradient(circle at 50% 24%, rgba(169,194,230,.18), transparent 28%), linear-gradient(135deg, rgba(16,40,71,.96), rgba(7,17,31,.98))';
      const candidates = getScenePhotoCandidates(scene);
      const scenePhotoKey = `${scene.story || ACTIVE_STORY}-${scene.photoIndex || 1}-${state.sceneId}`;

      imageEl.dataset.photoKey = scenePhotoKey;
      imageEl.style.backgroundImage = fallback;
      imageEl.style.backgroundSize = 'cover';
      imageEl.style.backgroundPosition = 'center';

      loadFirstExistingImage(
        candidates,
        (src) => {
          if (imageEl.dataset.photoKey !== scenePhotoKey) return;
          imageEl.style.backgroundImage = `url("${src}"), ${fallback}`;
        },
        () => {
          if (imageEl.dataset.photoKey !== scenePhotoKey) return;
          imageEl.style.backgroundImage = fallback;
        }
      );
    }

    function updateOverlayDensity(scene) {
      const overlay = byId('sceneOverlay');
      if (!overlay) return;
      const dialogue = getActiveDialogue(scene);
      const textLength = (dialogue[1] || '').length;
      const choiceCount = scene.choices && state.selected[state.sceneId] === undefined ? scene.choices.length : 0;
      let lift = 8;
      if (choiceCount >= 3) lift += 16;
      if (choiceCount >= 4) lift += 14;
      if (textLength > 140) lift += 10;
      if (textLength > 220) lift += 10;
      overlay.style.paddingBottom = `${lift}px`;
    }

    function renderChoices(scene) {
      const choices = byId('choices');
      const continueRow = byId('continueRow');
      if (!choices || !continueRow) return;

      const selected = state.selected[state.sceneId];
      choices.innerHTML = '';
      continueRow.style.display = 'none';

      if (scene.gameOver) {
        const btn = document.createElement('button');
        btn.className = 'btn primary';
        btn.textContent = 'Начать заново';
        btn.addEventListener('click', showGameOver);
        choices.appendChild(btn);
        return;
      }

      if (scene.final) {
        const btn = document.createElement('button');
        btn.className = 'btn primary';
        btn.textContent = 'Посмотреть финал';
        btn.addEventListener('click', showEnding);
        choices.appendChild(btn);
        return;
      }

      if (!scene.choices) {
        continueRow.style.display = 'flex';
        return;
      }

      if (selected !== undefined) {
        continueRow.style.display = 'flex';
        return;
      }

      scene.choices.forEach((choice, index) => {
        const btn = document.createElement('button');
        btn.className = 'choice';
        btn.innerHTML = `<span class="choice-num">${String(index + 1).padStart(2, '0')}</span><strong>${choice.title}</strong>`;
        btn.addEventListener('click', () => choose(index));
        choices.appendChild(btn);
      });
    }

    function choose(choiceIndex) {
      const scene = currentScene();
      const choice = scene.choices && scene.choices[choiceIndex];
      if (!choice) return;
      state.selected[state.sceneId] = choiceIndex;
      applyEffects(choice.effects || {});
      pulseProgressBar();
      render();
    }

    function resolveNextSceneId(scene) {
      const selected = state.selected[state.sceneId];
      const selectedChoice = scene.choices && selected !== undefined ? scene.choices[selected] : null;
      const target = selectedChoice?.next || scene.next || 'final_scene';
      if (target === 'crisis_router') return getCrisisSceneId();
      if (target === 'inspector_router') return state.mashaDocumentFixed ? 'inspector_good' : 'inspector_problem';
      return target;
    }

    function nextScene() {
      if (state.finished) return showEnding();
      const scene = currentScene();
      if (scene.gameOver) return showGameOver();
      if (scene.final) return showEnding();
      state.sceneId = resolveNextSceneId(scene);
      render();
    }

    function renderHud() {
      byId('rank').textContent = getRank();
      byId('currency').textContent = Math.max(0, 3 + state.trustPassengers);
      byId('premiumChoices').textContent = Number(state.admittedMistake) + Number(state.crisisResolved);
      byId('profValue').textContent = state.conscience;
      byId('safetyValue').textContent = state.courage;
      byId('empathyValue').textContent = state.empathy;
      byId('profBar').style.width = `${moralPercent(state.conscience)}%`;
      byId('safetyBar').style.width = `${moralPercent(state.courage)}%`;
      byId('empathyBar').style.width = `${moralPercent(state.empathy)}%`;
    }

    function renderDebuffs() {
      const list = byId('debuffList');
      if (!list) return;
      list.innerHTML = state.debuffs.length
        ? state.debuffs.map(item => `<div class="debuff">${item}</div>`).join('')
        : '<div class="empty">Пока нет. Но первый рейс уже проверяет Артёма.</div>';
    }

    function buildPerformanceRemarks() {
  return window.GameLogic.buildPerformanceRemarks(state);
}

    function renderCustomRemarks(targetId, remarks) {
      const el = byId(targetId);
      if (!el) return;
      const levelText = { high: 'критично', mid: 'сложно', low: 'сильно' };
      el.innerHTML = remarks.map(item => `
        <div class="remark-item">
          <div class="remark-icon">${item.icon}</div>
          <div class="remark-body">
            <div class="remark-title">${item.title}</div>
            <div class="remark-text">${item.text}</div>
            <div class="remark-level ${item.level}">${levelText[item.level]}</div>
          </div>
        </div>
      `).join('');
    }

    function renderRemarks(targetId) {
      renderCustomRemarks(targetId, buildPerformanceRemarks());
    }

    function showGameOver() {
      const scene = currentScene();
      state.gameOver = true;
      state.finished = true;
      state.endingType = scene.gameOver ? 'ne_dopushen' : 'oboydetsya';
      byId('gameOverText').textContent = scene.gameOverText || 'Кризис ушёл в трагическую ветку. Рейс дальше продолжать нельзя.';
      if (scene.gameOverRemarks) {
        renderCustomRemarks('gameOverRemarks', scene.gameOverRemarks);
      } else {
        renderRemarks('gameOverRemarks');
      }
      save();
      byId('gameOverModal').classList.add('show');
    }

   function showEnding() {
  const modal = byId('endingModal');
  if (!modal) return;

  state.finished = true;
  state.endingType = getEnding();
  save();

  const data = ENDINGS[state.endingType] || ENDINGS.po_raspisaniyu;

  byId('endingTitle').textContent = data.title;
  byId('endingText').textContent = data.text;

  renderRemarks('remarksList');
  modal.classList.add('show');
}

  function restart() {
  GameStorage.reset(STORAGE_KEY);
  state = defaultState();
  save();
  byId('endingModal').classList.remove('show');
  byId('gameOverModal').classList.remove('show');
  render();
  toast('Первый рейс начался заново');
}

    function runSelfTests() {
      console.group('Первый рейс · self-tests');
      console.assert(Boolean(scenes.prologue && scenes.final_scene), 'Ключевые сцены существуют');
      console.assert(getScenePhotoPath(scenes.prologue) === 'assets/images/scenes/story-01/01.webp', 'Первый кадр истории ищет webp');
      console.assert(getScenePhotoPath(scenes.boarding_help) === 'assets/images/scenes/story-01/02.webp', 'Последствия посадки используют кадр 02');
      console.assert(getScenePhotoPath(scenes.masha_document) === 'assets/images/scenes/story-01/04.webp', 'Блок Маши использует кадр 04');
      console.assert(getScenePhotoPath(scenes.final_scene) === 'assets/images/scenes/story-01/12.webp', 'Финал использует кадр 12');

      const originalState = JSON.parse(JSON.stringify(state));

      state = defaultState();
      state.mashaDocumentFixed = true;
      console.assert(resolveNextSceneId(scenes.inspector) === 'inspector_good', 'Исправленные документы Маши проходят ревизора');

      state = defaultState();
      state.mashaDocumentHidden = true;
      state.fatalDocumentViolation = true;
      console.assert(resolveNextSceneId(scenes.inspector) === 'inspector_problem', 'Скрытая ошибка Маши ведёт к остановке рейса');
      console.assert(scenes.inspector_problem.gameOver === true, 'Скрытая ошибка Маши ведёт к проигрышу');

      state = defaultState();
      state.sceneId = 'boarding';
      state.selected = { boarding: 0 };
      console.assert(resolveNextSceneId(scenes.boarding) === 'boarding_help', 'Первый выбор посадки ведёт в ветку помощи');

      state = defaultState();
      state.empathy = 4;
      state.conscience = 2;
      state.courage = 3;
      state.crisisResolved = true;
      state.helpedIlya = true;
      state.mashaDocumentFixed = true;
      state.helpedMother = true;
      state.olegTrust = 2;
      console.assert(getEnding() === 'provodnik', 'Хороший маршрут ведёт в финал «Проводник»');

      state = defaultState();
      state.empathy = 2;
      state.conscience = 1;
      state.courage = 2;
      state.crisisResolved = true;
      state.helpedIlya = true;
      state.mashaDocumentFixed = true;
      console.assert(getEnding() === 'vtoroy_shans', 'Ответственный смешанный маршрут ведёт во второй шанс');

      state = originalState;
      console.groupEnd();
    }

    function init() {
      renderStoryCards();
      showScreen('menu');
      byId('openStoriesBtn').addEventListener('click', () => showScreen('stories'));
      byId('continueStoryBtn').addEventListener('click', () => openStory(ACTIVE_STORY));
      byId('backToMenuBtn').addEventListener('click', () => showScreen('menu'));
      byId('homeNavBtn').addEventListener('click', () => showScreen('menu'));
      byId('storiesNavBtn').addEventListener('click', () => showScreen('stories'));
      byId('gameNavBtn').addEventListener('click', () => openStory(ACTIVE_STORY));
      byId('nextBtn').addEventListener('click', nextScene);
      byId('restartBtn').addEventListener('click', restart);
      byId('playAgainBtn').addEventListener('click', restart);
      byId('restartGameOverBtn').addEventListener('click', restart);
      byId('skipBtn').addEventListener('click', showEnding);
      byId('closeEndingBtn').addEventListener('click', () => byId('endingModal').classList.remove('show'));
      runSelfTests();
      render();
      showScreen('menu');
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
