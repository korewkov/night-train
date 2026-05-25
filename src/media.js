(function () {
  'use strict';

  const {
    ACTIVE_STORY,
    SCENE_IMAGE_BASE_PATH,
    SCENE_IMAGE_EXTENSIONS
  } = window.GameData;

  function getStoryCoverBasePath(storyId) {
    return `assets/images/covers/${storyId}/cover`;
  }

  function getStoryCoverCandidates(storyId) {
    return SCENE_IMAGE_EXTENSIONS.map((extension) => {
      return `${getStoryCoverBasePath(storyId)}.${extension}`;
    });
  }

  function getScenePhotoBasePath(scene) {
    const storyFolder = scene.story || ACTIVE_STORY;
    const fileNumber = String(scene.photoIndex || 1).padStart(2, '0');
    return `${SCENE_IMAGE_BASE_PATH}/${storyFolder}/${fileNumber}`;
  }

  function getScenePhotoPath(scene, extension = SCENE_IMAGE_EXTENSIONS[0]) {
    return `${getScenePhotoBasePath(scene)}.${extension}`;
  }

  function getScenePhotoCandidates(scene, characters) {
    const baseCharacter = characters[scene.character] || characters.narrator;
    const manualImage = scene.photo || scene.image || scene.cardImage || baseCharacter.card || '';

    if (manualImage && manualImage.trim()) {
      return [manualImage];
    }

    return SCENE_IMAGE_EXTENSIONS.map((extension) => {
      return getScenePhotoPath(scene, extension);
    });
  }

  function loadFirstExistingImage(candidates, onSuccess, onError) {
    const [current, ...rest] = candidates;

    if (!current) {
      if (typeof onError === 'function') onError();
      return;
    }

    const img = new Image();

    img.onload = () => {
      if (typeof onSuccess === 'function') onSuccess(current);
    };

    img.onerror = () => {
      loadFirstExistingImage(rest, onSuccess, onError);
    };

    img.src = current;
  }

  window.GameMedia = {
    getStoryCoverCandidates,
    getScenePhotoPath,
    getScenePhotoCandidates,
    loadFirstExistingImage
  };
})();
