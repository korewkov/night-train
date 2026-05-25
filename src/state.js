(function () {
  'use strict';

  function createDefaultState() {
    return {
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
      endingType: null
    };
  }

  function load(storageKey) {
    return window.GameStorage.load(storageKey, createDefaultState());
  }

  function save(storageKey, state) {
    window.GameStorage.save(storageKey, state);
  }

  function reset(storageKey) {
    window.GameStorage.reset(storageKey);
    return createDefaultState();
  }

  window.GameState = {
    createDefaultState,
    load,
    save,
    reset
  };
})();
