'use strict';

const {
  STORAGE_KEY,
  ACTIVE_STORY,
  ROUTE_NAMES,
  STORY_LIBRARY,
  characters,
  scenes,
  ENDINGS
} = window.GameData;

let currentStoryId = ACTIVE_STORY;

function getCurrentStoryId() {
  return state?.storyId || currentStoryId || ACTIVE_STORY;
}

function defaultState(storyId = getCurrentStoryId()) {
  return window.GameState.createDefaultState(storyId);
}

function loadState(storyId = ACTIVE_STORY) {
  currentStoryId = storyId;
  return window.GameState.load(STORAGE_KEY, storyId);
}

let state = loadState(currentStoryId);

function save() {
  const storyId = getCurrentStoryId();
  state.storyId = storyId;
  window.GameState.save(STORAGE_KEY, state);

  if (window.NightTrainCloud) {
    window.NightTrainCloud.queueSave(storyId, state);
  }
}

function clampMoral(value) {
  return Math.max(-5, Math.min(8, value));
}

function moralPercent(value) {
  return Math.round(((clampMoral(value) + 5) / 13) * 100);
}

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

function byId(id) {
  return document.getElementById(id);
}

function setActiveNav(screenName) {
  const map = { menu: 'homeNavBtn', stories: 'storiesNavBtn', game: 'gameNavBtn' };
  ['homeNavBtn', 'storiesNavBtn', 'gameNavBtn'].forEach((id) => byId(id)?.classList.remove('active'));
  byId(map[screenName])?.classList.add('active');
}

function showScreen(screenName) {
  ['menuScreen', 'storiesScreen', 'gameScreen'].forEach((id) => byId(id)?.classList.add('hidden'));
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

    window.GameMedia.loadFirstExistingImage(
      window.GameMedia.getStoryCoverCandidates(storyId),
      (src) => {
        coverEl.style.backgroundImage = `url("${src}"), ${fallback}`;
      },
      () => {
        coverEl.style.backgroundImage = fallback;
      }
    );
  });
}

function openStory(storyId) {
  const story = STORY_LIBRARY.find((item) => item.id === storyId);
  if (!story || !story.active) return;

  currentStoryId = storyId;
  state = loadState(storyId);
  showScreen('game');
  render();

  if (window.NightTrainCloud) {
    window.NightTrainCloud.loadCloudProgress(storyId);
  }
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

function shuffleIndexes(length) {
  const indexes = Array.from({ length }, (_, index) => index);

  for (let i = indexes.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }

  return indexes;
}

function getChoiceOrder(scene) {
  if (!scene || !Array.isArray(scene.choices)) return [];

  if (!state.choiceOrders || typeof state.choiceOrders !== 'object') {
    state.choiceOrders = {};
  }

  const sceneId = state.sceneId;
  const savedOrder = state.choiceOrders[sceneId];
  const isValidSavedOrder =
    Array.isArray(savedOrder) &&
    savedOrder.length === scene.choices.length &&
    savedOrder.every((index) => Number.isInteger(index) && index >= 0 && index < scene.choices.length);

  if (isValidSavedOrder) {
    return savedOrder;
  }

  const nextOrder = shuffleIndexes(scene.choices.length);
  state.choiceOrders[sceneId] = nextOrder;

  return nextOrder;
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
  ['conscience', 'courage', 'empathy', 'discipline', 'trustPassengers', 'ilyaTrust', 'mashaTrust', 'olegTrust'].forEach((key) => {
    if (typeof effects[key] === 'number') state[key] = clampMoral((state[key] || 0) + effects[key]);
  });

  ['helpedIlya', 'alienatedIlya', 'mashaDocumentFixed', 'mashaDocumentHidden', 'fatalDocumentViolation', 'betrayedMasha', 'pressuredMasha', 'ignoredOleg', 'humiliatedOleg', 'helpedMother', 'childDrawing', 'admittedMistake', 'crisisResolved', 'tragedyFlag'].forEach((key) => {
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
  const found = Object.values(characters).find((item) => item.name === speakerName);
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
  const activeCharacter = Object.values(characters).find((item) => item.name === speakerName) || baseCharacter;
  const role = activeCharacter.role || 'участник рейса';

  byId('speakerName').textContent = speakerName || activeCharacter.name || 'Собеседник';
  byId('speakerRole').textContent = role.toUpperCase();
}

function applyScenePhoto(scene) {
  const imageEl = byId('characterCardImage');
  if (!imageEl) return;

  const fallback = 'radial-gradient(circle at 50% 24%, rgba(169,194,230,.18), transparent 28%), linear-gradient(135deg, rgba(16,40,71,.96), rgba(7,17,31,.98))';
  const candidates = window.GameMedia.getScenePhotoCandidates(scene, characters);
  const scenePhotoKey = `${scene.story || getCurrentStoryId()}-${scene.photoIndex || 1}-${state.sceneId}`;

  imageEl.dataset.photoKey = scenePhotoKey;
  imageEl.style.backgroundImage = fallback;
  imageEl.style.backgroundSize = 'cover';
  imageEl.style.backgroundPosition = 'center';

  window.GameMedia.loadFirstExistingImage(
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

  const choiceOrder = getChoiceOrder(scene);

  choiceOrder.forEach((originalChoiceIndex, visualIndex) => {
    const choice = scene.choices[originalChoiceIndex];
    if (!choice) return;

    const btn = document.createElement('button');
    btn.className = 'choice';
    btn.innerHTML = `
      <span class="choice-num">${String(visualIndex + 1).padStart(2, '0')}</span>
      <strong>${choice.title}</strong>
    `;
    btn.addEventListener('click', () => choose(originalChoiceIndex));
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
    ? state.debuffs.map((item) => `<div class="debuff">${item}</div>`).join('')
    : '<div class="empty">Пока нет. Но первый рейс уже проверяет Артёма.</div>';
}

function buildPerformanceRemarks() {
  return window.GameLogic.buildPerformanceRemarks(state);
}

function renderCustomRemarks(targetId, remarks) {
  const el = byId(targetId);
  if (!el) return;
  const levelText = { high: 'критично', mid: 'сложно', low: 'сильно' };
  el.innerHTML = remarks.map((item) => `
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
  state.endingType = state.endingType || getEnding();

  if (window.NightTrainCloud && !state.resultSaved) {
    window.NightTrainCloud.saveResult(getCurrentStoryId(), state.endingType, state);
    state.resultSaved = true;
  }

  save();

  const data = ENDINGS[state.endingType] || ENDINGS.po_raspisaniyu;

  byId('endingTitle').textContent = data.title;
  byId('endingText').textContent = data.text;

  renderRemarks('remarksList');
  modal.classList.add('show');
}

function restart() {
  const storyId = getCurrentStoryId();
  currentStoryId = storyId;
  state = window.GameState.reset(STORAGE_KEY, storyId);
  save();
  byId('endingModal').classList.remove('show');
  byId('gameOverModal').classList.remove('show');
  render();
  toast('Первый рейс начался заново');
}

function runSelfTests() {
  if (!window.GameTests) return;

  window.GameTests.runSelfTests({
    scenes,
    defaultState,
    resolveNextSceneId,
    getEnding,
    getScenePhotoPath: window.GameMedia.getScenePhotoPath,
    getCurrentState: () => state,
    setCurrentState: (nextState) => {
      state = {
        ...defaultState(nextState?.storyId || getCurrentStoryId()),
        ...nextState
      };
    }
  });
}

function init() {
  renderStoryCards();
  showScreen('menu');
  byId('openStoriesBtn').addEventListener('click', () => showScreen('stories'));
  byId('continueStoryBtn').addEventListener('click', () => openStory(getCurrentStoryId()));
  byId('backToMenuBtn').addEventListener('click', () => showScreen('menu'));
  byId('homeNavBtn').addEventListener('click', () => showScreen('menu'));
  byId('storiesNavBtn').addEventListener('click', () => showScreen('stories'));
  byId('gameNavBtn').addEventListener('click', () => openStory(getCurrentStoryId()));
  byId('nextBtn').addEventListener('click', nextScene);
  byId('restartBtn').addEventListener('click', restart);
  byId('playAgainBtn').addEventListener('click', restart);
  byId('restartGameOverBtn').addEventListener('click', restart);
  byId('skipBtn').addEventListener('click', showEnding);
  byId('closeEndingBtn').addEventListener('click', () => byId('endingModal').classList.remove('show'));

  runSelfTests();

  if (window.NightTrainCloud) {
    window.NightTrainCloud.init({
      onLoadProgress: (cloudState, storyId = getCurrentStoryId()) => {
        currentStoryId = storyId;
        state = {
          ...defaultState(storyId),
          ...cloudState,
          storyId: cloudState?.storyId || storyId
        };

        save();
        render();
        toast('Облачный прогресс загружен');
      }
    });
  }

  if (window.NightTrainAdmin) {
    window.NightTrainAdmin.init();
  }

  render();
  showScreen('menu');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
