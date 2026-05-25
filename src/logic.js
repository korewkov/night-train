'use strict';

window.GameLogic = {
  getCrisisSceneId(state) {
    if (state.tragedyFlag) return 'crisis_tragedy';

    if (state.ignoredOleg || state.humiliatedOleg || state.olegTrust < 0) {
      return 'crisis_oleg';
    }

    if (state.alienatedIlya || state.ilyaTrust < 0 || state.empathy < 0) {
      return 'crisis_ilya';
    }

    if (!state.mashaDocumentFixed && (state.betrayedMasha || state.pressuredMasha || state.mashaTrust < -1)) {
      return 'crisis_masha';
    }

    if (state.olegTrust >= 1) return 'crisis_oleg';
    if (state.helpedIlya) return 'crisis_ilya';

    return 'crisis_masha';
  },

  getEndingStats(state) {
    const humanWins = [
      state.helpedIlya,
      state.mashaDocumentFixed,
      state.olegTrust >= 1,
      state.helpedMother,
      state.crisisResolved
    ].filter(Boolean).length;

    const seriousMistakes = [
      state.alienatedIlya,
      state.ignoredOleg,
      state.humiliatedOleg,
      state.pressuredMasha,
      state.tragedyFlag,
      state.fatalDocumentViolation
    ].filter(Boolean).length;

    const moralBalance = (state.conscience || 0) + (state.empathy || 0) + (state.courage || 0);
    const formalScore = state.discipline || 0;

    return {
      humanWins,
      seriousMistakes,
      moralBalance,
      formalScore
    };
  },

  getEnding(state) {
    const stats = this.getEndingStats(state);

    if (state.fatalDocumentViolation) return 'ne_dopushen';

    if (state.tragedyFlag || (!state.crisisResolved && state.courage <= -2 && state.discipline <= 0)) {
      return 'oboydetsya';
    }

    if (state.conscience <= -3 && state.empathy <= -2) {
      return 'ne_dopushen';
    }

    if (
      state.crisisResolved &&
      stats.humanWins >= 4 &&
      stats.moralBalance >= 5 &&
      stats.seriousMistakes <= 1
    ) {
      return 'provodnik';
    }

    if (state.crisisResolved && stats.humanWins >= 3 && stats.moralBalance >= 2) {
      return 'vtoroy_shans';
    }

    if (state.crisisResolved && stats.seriousMistakes <= 2 && stats.moralBalance >= 0) {
      return 'vtoroy_shans';
    }

    return 'po_raspisaniyu';
  },

  getRank(state) {
    const ending = state.endingType || this.getEnding(state);

    const labels = {
      provodnik: 'Проводник',
      vtoroy_shans: 'Второй шанс',
      ne_dopushen: 'Не допущен',
      oboydetsya: 'Рейс сорван',
      po_raspisaniyu: 'По расписанию'
    };

    return labels[ending] || 'Артём';
  },

  buildPerformanceRemarks(state) {
    const remarks = [];
    const ending = state.endingType || this.getEnding(state);

    const endingRemarks = {
      provodnik: {
        icon: '⭐',
        title: 'Ты довёз не поезд. Ты довёз людей',
        text: 'Артём не спрятался в кризисе, сохранил человечность и взял ответственность за свои решения.',
        level: 'low'
      },
      vtoroy_shans: {
        icon: '🧭',
        title: 'Ошибки признаны',
        text: 'Первый рейс не сделал Артёма идеальным, но он перестал прятаться за форму и получил второй шанс.',
        level: 'mid'
      },
      po_raspisaniyu: {
        icon: '🚆',
        title: 'Поезд прибыл вовремя',
        text: 'Рейс доведён до конца, но решения были больше про порядок, чем про доверие. Это не провал, но и не сильная смена.',
        level: 'mid'
      },
      ne_dopushen: {
        icon: '🚫',
        title: 'Форма не делает человеком',
        text: 'Артём слишком часто выбирал самосохранение, ложь или холодность вместо ответственности.',
        level: 'high'
      },
      oboydetsya: {
        icon: '🌑',
        title: 'Остановка в темноте',
        text: 'Бездействие в кризисе привело к трагической ветке. В этой работе “обойдётся” — самая опасная фраза.',
        level: 'high'
      }
    };

    remarks.push(endingRemarks[ending] || endingRemarks.po_raspisaniyu);

    if (state.helpedIlya) {
      remarks.push({
        icon: '🧓',
        title: 'Илья Семёнович доверился',
        text: 'На посадке Артём не стал давить на слабого пассажира и помог без унижения.',
        level: 'low'
      });
    }

    if (state.mashaDocumentFixed) {
      remarks.push({
        icon: '📄',
        title: 'Документы Маши исправлены правильно',
        text: 'Артём не стал скрывать ошибку и передал ситуацию начальнику поезда. На ревизии проблем не возникло.',
        level: 'low'
      });
    }

    if (state.olegTrust >= 1) {
      remarks.push({
        icon: '🪟',
        title: 'Олег не остался один',
        text: 'Артём заметил напряжение раньше кризиса и не превратил пассажира во врага.',
        level: 'low'
      });
    }

    if (state.childDrawing) {
      remarks.push({
        icon: '🖍️',
        title: 'Ребёнок запомнил голос, который не ругался',
        text: 'Эмпатия стала не слабостью, а способом удержать вагон.',
        level: 'low'
      });
    }

    if (state.fatalDocumentViolation) {
      remarks.push({
        icon: '📄',
        title: 'Критическая ошибка с документами',
        text: 'Пассажир был пропущен без корректного исправления данных. Это фатальное нарушение для проводника.',
        level: 'high'
      });
    }

    if (state.betrayedMasha) {
      remarks.push({
        icon: '📄',
        title: 'Маша была предана',
        text: 'В момент давления Артём переложил ответственность на пассажирку.',
        level: 'high'
      });
    }

    if (state.alienatedIlya) {
      remarks.push({
        icon: '🧳',
        title: 'Посадка прошла быстро, но холодно',
        text: 'Порядок был сохранён, но пожилой пассажир почувствовал себя лишним.',
        level: 'mid'
      });
    }

    if (state.ignoredOleg || state.humiliatedOleg) {
      remarks.push({
        icon: '🍾',
        title: 'Олег дошёл до кризиса',
        text: 'Проблема не исчезла, когда Артём решил её не видеть или унизил человека.',
        level: 'high'
      });
    }

    if (state.crisisResolved) {
      remarks.push({
        icon: '🛟',
        title: 'Финальный кризис удержан',
        text: 'В конце рейса Артём не ушёл от ответственности и помог остановить срыв ситуации.',
        level: 'low'
      });
    }

    if (state.admittedMistake) {
      remarks.push({
        icon: '✓',
        title: 'Ошибка признана',
        text: 'Честность ухудшила формальную позицию, но сохранила человеческую.',
        level: 'low'
      });
    }

    return remarks.slice(0, 7);
  }
};
