(function () {
  'use strict';

  function getStoryStorageKey(storageKey, storyId) {
    return `${storageKey}_${storyId || 'story-01'}`;
  }

  function createDefaultState(storyId = 'story-01') {
    return {
      storyId,
      sceneId: 'prologue',
      selected: {},
      choiceOrders: {},
      debuffs: [],
      storyPath: [],

      conscience: 0,
      courage: 0,
      empathy: 0,
      discipline: 0,
      trustPassengers: 0,

      ilyaTrust: 0,
      mashaTrust: 0,
      olegTrust: 0,

      helpedIlya: false,
      alienatedIlya: false,

      mashaDocumentFixed: false,
      mashaDocumentHidden: false,
      fatalDocumentViolation: false,
      betrayedMasha: false,
      pressuredMasha: false,

      ignoredOleg: false,
      humiliatedOleg: false,

      helpedMother: false,
      childDrawing: false,
      admittedMistake: false,

      crisisResolved: false,
      tragedyFlag: false,

      finished: false,
      gameOver: false,
      endingType: null,
      resultSaved: false
    };
  }

  function normalizeState(savedState, storyId = 'story-01') {
    return {
      ...createDefaultState(storyId),
      ...(savedState || {}),
      storyId: savedState?.storyId || storyId
    };
  }

  function load(storageKey, storyId = 'story-01') {
    const defaultState = createDefaultState(storyId);
    const storyStorageKey = getStoryStorageKey(storageKey, storyId);
    const storyState = window.GameStorage.load(storyStorageKey, null);

    if (storyState) {
      return normalizeState(storyState, storyId);
    }

    if (storyId === 'story-01') {
      const legacyState = window.GameStorage.load(storageKey, null);
      if (legacyState) {
        return normalizeState(legacyState, storyId);
      }
    }

    return defaultState;
  }

  function save(storageKey, state) {
    const storyId = state?.storyId || 'story-01';
    window.GameStorage.save(getStoryStorageKey(storageKey, storyId), normalizeState(state, storyId));
  }

  function reset(storageKey, storyId = 'story-01') {
    window.GameStorage.reset(getStoryStorageKey(storageKey, storyId));
    return createDefaultState(storyId);
  }

  window.GameState = {
    createDefaultState,
    getStoryStorageKey,
    load,
    save,
    reset
  };
})();
