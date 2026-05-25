(function () {
  'use strict';

  function runSelfTests(api) {
    const {
      scenes,
      defaultState,
      resolveNextSceneId,
      getEnding,
      getScenePhotoPath,
      getCurrentState,
      setCurrentState
    } = api;

    console.group('Первый рейс · self-tests');

    console.assert(Boolean(scenes.prologue && scenes.final_scene), 'Ключевые сцены существуют');

    console.assert(
      getScenePhotoPath(scenes.prologue) === 'assets/images/scenes/story-01/01.webp',
      'Первый кадр истории ищет webp'
    );

    console.assert(
      getScenePhotoPath(scenes.boarding_help) === 'assets/images/scenes/story-01/02.webp',
      'Последствия посадки используют кадр 02'
    );

    console.assert(
      getScenePhotoPath(scenes.masha_document) === 'assets/images/scenes/story-01/04.webp',
      'Блок Маши использует кадр 04'
    );

    console.assert(
      getScenePhotoPath(scenes.final_scene) === 'assets/images/scenes/story-01/12.webp',
      'Финал использует кадр 12'
    );

    const originalState = JSON.parse(JSON.stringify(getCurrentState()));

    let testState = defaultState();
    testState.mashaDocumentFixed = true;
    setCurrentState(testState);

    console.assert(
      resolveNextSceneId(scenes.inspector) === 'inspector_good',
      'Исправленные документы Маши проходят ревизора'
    );

    testState = defaultState();
    testState.mashaDocumentHidden = true;
    testState.fatalDocumentViolation = true;
    setCurrentState(testState);

    console.assert(
      resolveNextSceneId(scenes.inspector) === 'inspector_problem',
      'Скрытая ошибка Маши ведёт к остановке рейса'
    );

    console.assert(
      scenes.inspector_problem.gameOver === true,
      'Скрытая ошибка Маши ведёт к проигрышу'
    );

    testState = defaultState();
    testState.sceneId = 'boarding';
    testState.selected = { boarding: 0 };
    setCurrentState(testState);

    console.assert(
      resolveNextSceneId(scenes.boarding) === 'boarding_help',
      'Первый выбор посадки ведёт в ветку помощи'
    );

    testState = defaultState();
    testState.empathy = 4;
    testState.conscience = 2;
    testState.courage = 3;
    testState.crisisResolved = true;
    testState.helpedIlya = true;
    testState.mashaDocumentFixed = true;
    testState.helpedMother = true;
    testState.olegTrust = 2;
    setCurrentState(testState);

    console.assert(
      getEnding() === 'provodnik',
      'Хороший маршрут ведёт в финал «Проводник»'
    );

    testState = defaultState();
    testState.empathy = 2;
    testState.conscience = 1;
    testState.courage = 2;
    testState.crisisResolved = true;
    testState.helpedIlya = true;
    testState.mashaDocumentFixed = true;
    setCurrentState(testState);

    console.assert(
      getEnding() === 'vtoroy_shans',
      'Ответственный смешанный маршрут ведёт во второй шанс'
    );

    setCurrentState(originalState);

    console.groupEnd();
  }

  window.GameTests = {
    runSelfTests
  };
})();
