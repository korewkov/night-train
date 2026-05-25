(function () {
  'use strict';

  const STORAGE_KEY = 'first_raid_visual_novel_v3';
    const ACTIVE_STORY = 'story-01';
    const SCENE_IMAGE_BASE_PATH = 'assets/images/scenes';
    const SCENE_IMAGE_EXTENSIONS = ['webp', 'jpg', 'jpeg', 'png'];
    const ROUTE_NAMES = ['Перрон', 'Илья', 'Маша', 'Олег', 'Ребёнок', 'Ревизор', 'Кризис', 'Финал'];

    const STORY_LIBRARY = [
      { id: 'story-01', number: 'История 01', title: 'Ночной рейс', description: 'Первый рейс Артёма: документы, конфликтные пассажиры, моральные выборы и финальный кризис.', active: true },
      { id: 'story-02', number: 'История 02', title: 'Зимняя пересадка', description: 'Сценарий в разработке.', active: false },
      { id: 'story-03', number: 'История 03', title: 'Плацкарт без сна', description: 'Сценарий в разработке.', active: false },
      { id: 'story-04', number: 'История 04', title: 'Последний вагон', description: 'Сценарий в разработке.', active: false },
      { id: 'story-05', number: 'История 05', title: 'Детская группа', description: 'Сценарий в разработке.', active: false },
      { id: 'story-06', number: 'История 06', title: 'Тревожная остановка', description: 'Сценарий в разработке.', active: false },
      { id: 'story-07', number: 'История 07', title: 'Соседнее купе', description: 'Сценарий в разработке.', active: false },
      { id: 'story-08', number: 'История 08', title: 'Ревизор в пути', description: 'Сценарий в разработке.', active: false },
      { id: 'story-09', number: 'История 09', title: 'Южный маршрут', description: 'Сценарий в разработке.', active: false },
      { id: 'story-10', number: 'История 10', title: 'Обратный билет', description: 'Сценарий в разработке.', active: false }
    ];

    const characters = {
      nina: { name: 'Нина Павловна', role: 'начальник поезда', meta: 'Наставник Артёма в первом рейсе', fallback: 'Н', card: '' },
      ilya: { name: 'Илья Семёнович', role: 'пожилой пассажир', meta: 'Теряется в очереди и старается никому не мешать', fallback: 'И', card: '' },
      masha: { name: 'Маша', role: 'студентка с ошибкой в документе', meta: 'Боится, что одна буква разрушит завтрашний экзамен', fallback: 'М', card: '' },
      oleg: { name: 'Олег', role: 'пассажир в кризисе', meta: 'Прячет внутренний срыв за грубостью и вызовом', fallback: 'О', card: '' },
      mother: { name: 'Женщина с ребёнком', role: 'мама в ночном вагоне', meta: 'Устала и пытается удержать ребёнка, себя и чужое раздражение', fallback: 'Р', card: '' },
      inspector: { name: 'Ревизор', role: 'проверяющий', meta: 'Проверяет не только документы, но и устойчивость решений', fallback: 'Р', card: '' },
      radio: { name: 'Рация', role: 'служебная связь', meta: 'Голос системы, который прерывает тишину рейса', fallback: '⚡', card: '' },
      narrator: { name: 'Внутренний голос', role: 'мысли Артёма', meta: 'То, что не звучит вслух, но влияет на каждый выбор', fallback: '•', card: '' }
    };

    const scenes = {
      prologue: {
        chapter: 'Пролог', location: 'Вокзал · ночь · перрон', route: 0, character: 'nina',
        dialogue: ['Нина Павловна', 'Артём, это твой первый рейс. Не пытайся быть идеальным. Просто смотри на людей и не прячься от решений.'],
        choices: null, next: 'boarding'
      },

      boarding: {
        chapter: 'Посадка', location: 'Вагон №7 · входная дверь', route: 1, character: 'ilya',
        dialogue: ['Илья Семёнович', 'Сынок, подожди секунду. Билет где-то здесь… Очередь уже злится, а я никак не найду.'],
        choices: [
          { title: 'Помочь ему найти билет', next: 'boarding_help', effects: { empathy: 1, conscience: 1, trustPassengers: 1, helpedIlya: true, ilyaTrust: 1 }, result: 'Ты помог Илье и не дал ситуации стать унизительной.', afterDialogue: ['Илья Семёнович', 'Спасибо, сынок. Я растерялся. Хорошо, что ты не стал кричать.'] },
          { title: 'Попросить его отойти в сторону', next: 'boarding_aside', effects: { discipline: 1, empathy: -1, alienatedIlya: true, ilyaTrust: -1 }, result: 'Посадка пошла быстрее, но Илья почувствовал себя лишним.', afterDialogue: ['Илья Семёнович', 'Да, конечно… отойду. Не хотел никого задерживать.'] },
          { title: 'Резко поторопить его', next: 'boarding_rude', effects: { empathy: -1, conscience: -1, trustPassengers: -1, alienatedIlya: true, ilyaTrust: -2, debuff: 'Холодность на посадке' }, result: 'Ты навёл скорость, но потерял доверие.', afterDialogue: ['Илья Семёнович', 'Не надо так… Я и сам понимаю, что мешаю.'] }
        ]
      },
      boarding_help: { chapter: 'После посадки', location: 'Входная дверь · посадка продолжается', route: 1, character: 'ilya', dialogue: ['Илья Семёнович', 'Ты помог мне не почувствовать себя обузой. Для старого человека это много значит.'], choices: null, next: 'chapter_wagon' },
      boarding_aside: { chapter: 'После посадки', location: 'Перрон · очередь двигается', route: 1, character: 'nina', dialogue: ['Нина Павловна', 'Быстро — не всегда значит хорошо. Но порядок на посадке ты удержал. Запомни: порядок без уважения долго не работает.'], choices: null, next: 'chapter_wagon' },
      boarding_rude: { chapter: 'После посадки', location: 'Перрон · дверь вагона', route: 1, character: 'nina', dialogue: ['Нина Павловна', 'Ты не стал увереннее от того, что сказал жёстко. Просто человеку стало стыдно.'], choices: null, next: 'chapter_wagon' },

      chapter_wagon: { chapter: 'Поезд тронулся', location: 'Коридор · ночь', route: 2, character: 'narrator', dialogue: ['Внутренний голос', 'Поезд пошёл. Вроде бы всё началось нормально. Но почему-то стало ещё тревожнее.'], choices: null, next: 'masha_document' },

      masha_document: {
        chapter: 'Документы Маши', location: 'Купе · проверка документов', route: 2, character: 'masha',
        dialogue: ['Маша', 'Пожалуйста, не высаживайте меня. В документе ошибка, но это правда мой билет. Мне завтра нужно быть на экзамене.'],
        choices: [
          { title: 'Позвать Нину Павловну и исправить данные', next: 'masha_honest', effects: { conscience: 1, discipline: 2, mashaDocumentFixed: true, mashaTrust: 1 }, result: 'Нина Павловна внесла корректировку. Документы в порядке.', afterDialogue: ['Маша', 'Спасибо. Я думала, меня сейчас просто высадят. Хорошо, что это можно было исправить по-человечески.'] },
          { title: 'Пропустить её и ничего не говорить', next: 'masha_hidden', effects: { empathy: 1, conscience: -2, discipline: -2, mashaTrust: 1, mashaDocumentHidden: true, fatalDocumentViolation: true, debuff: 'Скрыта ошибка в документе' }, result: 'Ты пустил пассажира с неоформленной ошибкой. На проверке это станет критическим нарушением.', afterDialogue: ['Маша', 'Спасибо… правда. Только теперь мне страшно, что это всплывёт позже.'] },
          { title: 'Пропустить, но предупредить: «без проблем»', next: 'masha_pressure', effects: { conscience: -2, empathy: -1, discipline: -2, mashaTrust: -2, mashaDocumentHidden: true, fatalDocumentViolation: true, pressuredMasha: true, debuff: 'Пассажир пропущен с нарушением' }, result: 'Ты не исправил данные и ещё заставил пассажирку молчать. На проверке это станет критическим нарушением.', afterDialogue: ['Маша', 'То есть теперь я должна молчать, потому что вы меня пропустили? Это неприятно.'] }
        ]
      },
      masha_honest: { chapter: 'После проверки', location: 'Купе · данные исправлены', route: 2, character: 'nina', dialogue: ['Нина Павловна', 'Вот так и надо. Увидел ошибку — не геройствуй и не скрывай. Сообщил старшему, внесли изменения, пассажир едет спокойно.'], choices: null, next: 'oleg_intro' },
      masha_hidden: { chapter: 'После проверки', location: 'Коридор · ночь', route: 2, character: 'masha', dialogue: ['Маша', 'Спасибо. Я правда не знала, что делать. Надеюсь, утром всё будет нормально.'], choices: null, next: 'oleg_intro' },
      masha_pressure: { chapter: 'После проверки', location: 'Купе · напряжение', route: 2, character: 'masha', dialogue: ['Маша', 'Я просила помочь, а не делать меня должной.'], choices: null, next: 'oleg_intro' },

      oleg_intro: {
        chapter: 'Олег', location: 'Коридор · тёмное окно', route: 3, character: 'oleg',
        dialogue: ['Олег', 'Парень, не трогай меня. Я тихо стою. Первый рейс? Вот и не лезь.'],
        choices: [
          { title: 'Спокойно спросить, что случилось', next: 'oleg_talk', effects: { empathy: 1, courage: 1, olegTrust: 2 }, result: 'Ты не стал давить и дал человеку выговориться.', afterDialogue: ['Олег', 'Странный ты. Обычно либо орут, либо проходят мимо. Ладно… просто постою здесь.'] },
          { title: 'Позвать Нину Павловну', next: 'oleg_report', effects: { discipline: 1, courage: 1, olegTrust: -1 }, result: 'Ты не стал решать рискованную ситуацию один.', afterDialogue: ['Олег', 'Сразу старших зовёшь? Ну зови. Только не делай вид, что понял меня.'] },
          { title: 'Не вмешиваться', next: 'oleg_ignore', effects: { courage: -1, discipline: -1, ignoredOleg: true, debuff: 'Олег оставлен один' }, result: 'Проблема осталась без внимания.', afterDialogue: ['Олег', 'Вот и правильно. Иди дальше. Тут всем проще не замечать.'] },
          { title: 'При всех сделать ему замечание', next: 'oleg_humiliate', effects: { empathy: -1, discipline: 1, olegTrust: -2, humiliatedOleg: true, debuff: 'Олег унижен' }, result: 'Ты остановил ситуацию, но унизил человека.', afterDialogue: ['Олег', 'При всех решил меня поставить на место? Ну запомню.'] }
        ]
      },
      oleg_talk: { chapter: 'Разговор с Олегом', location: 'Коридор · у окна', route: 3, character: 'oleg', dialogue: ['Олег', 'Я к сыну ехал. А сегодня узнал, что он не хочет меня видеть. Вот и всё.'], choices: null, next: 'child_conflict' },
      oleg_report: { chapter: 'После решения', location: 'Служебный проход', route: 3, character: 'nina', dialogue: ['Нина Павловна', 'Правильно, что позвал. Но помни: сообщить о проблеме — не значит перестать видеть человека.'], choices: null, next: 'child_conflict' },
      oleg_ignore: { chapter: 'После решения', location: 'Ночной коридор', route: 3, character: 'narrator', dialogue: ['Внутренний голос', 'Ты прошёл мимо. Но в поезде проблемы редко исчезают сами. Они просто ждут следующего момента.'], choices: null, next: 'child_conflict' },
      oleg_humiliate: { chapter: 'После замечания', location: 'Коридор · пассажиры замолчали', route: 3, character: 'oleg', dialogue: ['Олег', 'Форму надел — и уже людей судишь? Посмотрим, какой ты смелый дальше.'], choices: null, next: 'child_conflict' },

      child_conflict: {
        chapter: 'Ребёнок плачет', location: '02:40 · купейный вагон', route: 4, character: 'mother',
        dialogue: ['Женщина с ребёнком', 'Извините… Он боится поездов. Я пытаюсь его успокоить, но уже не справляюсь.'],
        choices: [
          { title: 'Поддержать мать и успокоить пассажиров', next: 'child_help', effects: { empathy: 1, courage: 1, trustPassengers: 1, helpedMother: true, childDrawing: true }, result: 'Ты помог снизить напряжение.', afterDialogue: ['Женщина с ребёнком', 'Спасибо. Когда вы сказали спокойно, он тоже будто немного успокоился.'] },
          { title: 'Попросить выйти с ребёнком в коридор', next: 'child_corridor', effects: { discipline: 1, empathy: -1 }, result: 'В купе стало тише, но мать почувствовала себя виноватой.', afterDialogue: ['Женщина с ребёнком', 'Хорошо… мы выйдем. Простите, что мешаем.'] },
          { title: 'Не вмешиваться', next: 'child_ignore', effects: { courage: -1, empathy: -1, trustPassengers: -1, debuff: 'Конфликт из-за ребёнка' }, result: 'Конфликт начал расти.', afterDialogue: ['Женщина с ребёнком', 'Пожалуйста, скажите им хоть что-нибудь. Я одна не справляюсь.'] },
          { title: 'Жёстко потребовать тишины', next: 'child_strict', effects: { courage: 1, empathy: -1 }, result: 'Стало тише, но не спокойнее.', afterDialogue: ['Женщина с ребёнком', 'Тише стало. Но теперь мне ещё стыднее.'] }
        ]
      },
      child_help: { chapter: 'После конфликта', location: 'Купе · тише', route: 4, character: 'mother', dialogue: ['Женщина с ребёнком', 'Спасибо. Он сказал, что вы добрый проводник. Для него это важно.'], choices: null, next: 'ilya_night' },
      child_corridor: { chapter: 'После конфликта', location: 'Коридор · ночной свет', route: 4, character: 'mother', dialogue: ['Женщина с ребёнком', 'Мы постоим здесь. Просто он маленький. Не всё можно выключить по просьбе.'], choices: null, next: 'ilya_night' },
      child_ignore: { chapter: 'После конфликта', location: 'Купе · спор пассажиров', route: 4, character: 'narrator', dialogue: ['Внутренний голос', 'Ты промолчал. И вагон начал решать проблему сам — грубо и громко.'], choices: null, next: 'ilya_night' },
      child_strict: { chapter: 'После замечания', location: 'Купе · напряжение осталось', route: 4, character: 'nina', dialogue: ['Нина Павловна', 'Ты добился тишины. Но это не всегда значит, что ты решил проблему.'], choices: null, next: 'ilya_night' },

      ilya_night: { chapter: 'Ночной разговор', location: 'Купе 9 · ночь', route: 4, character: 'ilya', dialogue: ['Илья Семёнович', 'Знаешь, страшно не когда поезд уходит. Страшно, когда ты сам перестаёшь решаться куда-то ехать.'], choices: null, next: 'inspector' },

      inspector: {
        chapter: 'Проверка', location: 'Утро · коридор', route: 5, character: 'inspector',
        dialogue: ['Ревизор', 'Доброе утро. Проверим документы по вагону.'],
        choices: null,
        next: 'inspector_router'
      },
      inspector_good: { chapter: 'Проверка пройдена', location: 'Утро · коридор', route: 5, character: 'inspector', dialogue: ['Ревизор', 'По документам всё чисто. Исправление внесено корректно. Хорошего рейса, проводник.'], choices: null, next: 'pre_crisis' },
      inspector_problem: {
        chapter: 'Критическая проверка', location: 'Утро · коридор', route: 5, character: 'inspector',
        dialogue: ['Ревизор', 'Проводник, это не “маленькая ошибка”. Вы фактически провезли пассажира без корректного оформления. Это считается безбилетным проездом. Нарушение тянет вплоть до увольнения. Рейс для вас окончен.'],
        choices: null,
        gameOver: true,
        gameOverText: 'Пассажир был пропущен с ошибкой в документе без исправления данных. На проверке это квалифицировали как провоз безбилетного пассажира. Игра окончена.',
        gameOverRemarks: [
          { icon: '📄', title: 'Критическая ошибка с документами', text: 'Ошибка была замечена, но не передана начальнику поезда и не исправлена.', level: 'high' },
          { icon: '🚫', title: 'Провоз без корректного оформления', text: 'Пассажир оказался в рейсе без правильно оформленных данных. Это фатальное нарушение.', level: 'high' },
          { icon: '⚠️', title: 'Риск увольнения', text: 'Такое решение нельзя “отыграть” позже. Работа проводника на этом рейсе прекращается.', level: 'high' }
        ]
      },


      pre_crisis: { chapter: 'Перед кризисом', location: 'Ночной коридор · техническая остановка', route: 6, character: 'narrator', dialogue: ['Внутренний голос', 'Казалось, самая сложная часть уже позади. Но поезд как будто специально оставил главный вопрос на конец.'], choices: null, next: 'crisis_router' },

      crisis_oleg: {
        chapter: 'Кризис Олега', location: 'Техническая остановка · тамбур', route: 6, character: 'oleg',
        dialogue: ['Олег', 'Открой дверь. Мне надо выйти. Не учи меня жить.'],
        choices: [
          { title: 'Встать у двери и говорить спокойно', next: 'crisis_oleg_talk', effects: { courage: 1, empathy: 1, crisisResolved: true }, result: 'Ты удержал ситуацию без грубости.', afterDialogue: ['Олег', 'Я не хотел ничего плохого. Просто меня накрыло. Спасибо, что не стал орать.'] },
          { title: 'Позвать Нину Павловну', next: 'crisis_oleg_help', effects: { discipline: 1, conscience: 1, crisisResolved: true }, result: 'Ты не стал геройствовать один.', afterDialogue: ['Нина Павловна', 'Правильно. В таких ситуациях лучше не быть одному.'] },
          { title: 'Схватить его', next: 'crisis_oleg_rough', effects: { courage: 1, empathy: -2, debuff: 'Грубое вмешательство' }, result: 'Ты остановил Олега, но сделал это грубо.', afterDialogue: ['Олег', 'Руки убери! Я не животное.'] },
          { title: 'Отойти в сторону', next: 'crisis_tragedy', effects: { courage: -2, discipline: -2, tragedyFlag: true }, result: 'Ты ушёл от решения в самый опасный момент.', afterDialogue: ['Внутренний голос', 'Ты сделал шаг назад. И этого шага хватило, чтобы всё сорвалось.'] }
        ]
      },

      crisis_ilya: {
        chapter: 'Кризис Ильи', location: 'Переход между вагонами', route: 6, character: 'ilya',
        dialogue: ['Илья Семёнович', 'Я просто посижу минутку… Что-то нехорошо мне. Не хотел никого тревожить.'],
        choices: [
          { title: 'Сразу позвать помощь', next: 'crisis_ilya_help', effects: { discipline: 1, courage: 1, crisisResolved: true }, result: 'Ты не потерял время.', afterDialogue: ['Илья Семёнович', 'Спасибо. Я бы сам ещё долго делал вид, что всё нормально.'] },
          { title: 'Попробовать справиться самому', next: 'crisis_ilya_self', effects: { conscience: -1, discipline: -1, debuff: 'Потеря времени' }, result: 'Ты потерял время, потому что не хотел выглядеть слабым.', afterDialogue: ['Нина Павловна', 'В таких ситуациях нельзя играть в героя. Нужно звать помощь.'] },
          { title: 'Сначала расспросить его', next: 'crisis_ilya_doubt', effects: { empathy: -1, debuff: 'Сомнение вместо помощи' }, result: 'Ты слишком долго сомневался.', afterDialogue: ['Внутренний голос', 'Иногда человек просит о помощи не словами. Это надо услышать.'] },
          { title: 'Оставить и вернуться позже', next: 'crisis_tragedy', effects: { courage: -2, empathy: -2, tragedyFlag: true }, result: 'Помощь пришла слишком поздно.', afterDialogue: ['Внутренний голос', 'Ты решил вернуться потом. Но потом иногда бывает поздно.'] }
        ]
      },

      crisis_masha: {
        chapter: 'Кризис Маши', location: 'Тамбур · утро близко', route: 6, character: 'masha',
        dialogue: ['Маша', 'Я вам поверила. А теперь не понимаю, помогли вы мне или просто использовали ситуацию.'],
        choices: [
          { title: 'Честно извиниться', next: 'crisis_masha_apology', effects: { conscience: 2, empathy: 1, admittedMistake: true, crisisResolved: true }, result: 'Ты признал, что был неправ.', afterDialogue: ['Маша', 'Я не знаю, простила ли. Но спасибо, что хотя бы не оправдываетесь.'] },
          { title: 'Сказать: «Я просто делал работу»', next: 'crisis_masha_job', effects: { discipline: 1, empathy: -1 }, result: 'Ты выбрал формальный ответ.', afterDialogue: ['Маша', 'Вот именно. Работа. А я думала, передо мной человек.'] },
          { title: 'Начать оправдываться', next: 'crisis_masha_excuse', effects: { conscience: -1, debuff: 'Оправдание вместо признания' }, result: 'Ты говорил о себе вместо того, чтобы услышать Машу.', afterDialogue: ['Маша', 'Вы опять объясняете себя. А меня вы вообще слышите?'] },
          { title: 'Уйти от разговора', next: 'crisis_tragedy', effects: { courage: -1, empathy: -2, tragedyFlag: true }, result: 'Ты снова ушёл от живого разговора.', afterDialogue: ['Внутренний голос', 'Ты ушёл. И оставил после себя не тишину, а обиду.'] }
        ]
      },

      crisis_oleg_talk: { chapter: 'После кризиса', location: 'Тамбур · техническая остановка', route: 6, character: 'oleg', dialogue: ['Олег', 'Спасибо. Я сорвался. Хорошо, что ты не сделал из меня врага.'], choices: null, next: 'final_scene' },
      crisis_oleg_help: { chapter: 'После кризиса', location: 'Тамбур · служебная связь', route: 6, character: 'nina', dialogue: ['Нина Павловна', 'Просить помощи — нормально. Особенно когда отвечаешь за людей.'], choices: null, next: 'final_scene' },
      crisis_oleg_rough: { chapter: 'После кризиса', location: 'Тамбур · пассажиры проснулись', route: 6, character: 'nina', dialogue: ['Нина Павловна', 'Ты остановил его. Но сделал это так, что теперь вагон боится тебя.'], choices: null, next: 'final_scene' },
      crisis_ilya_help: { chapter: 'После кризиса', location: 'Переход между вагонами', route: 6, character: 'ilya', dialogue: ['Илья Семёнович', 'Спасибо, сынок. Я боялся попросить. Ты заметил раньше.'], choices: null, next: 'final_scene' },
      crisis_ilya_self: { chapter: 'После кризиса', location: 'Переход · вызов наставницы', route: 6, character: 'nina', dialogue: ['Нина Павловна', 'Ты потерял время. Не потому что не знал, а потому что хотел справиться один.'], choices: null, next: 'final_scene' },
      crisis_ilya_doubt: { chapter: 'После кризиса', location: 'Переход · холодный свет', route: 6, character: 'narrator', dialogue: ['Внутренний голос', 'Ты слишком долго проверял, правда ли человеку плохо. Иногда это уже видно.'], choices: null, next: 'final_scene' },
      crisis_masha_apology: { chapter: 'После разговора', location: 'Тамбур · тихий разговор', route: 6, character: 'masha', dialogue: ['Маша', 'Ладно. Я не сразу забуду. Но вы хотя бы сказали честно.'], choices: null, next: 'final_scene' },
      crisis_masha_job: { chapter: 'После разговора', location: 'Тамбур · разговор оборвался', route: 6, character: 'masha', dialogue: ['Маша', 'Понятно. Тогда просто делайте свою работу.'], choices: null, next: 'final_scene' },
      crisis_masha_excuse: { chapter: 'После разговора', location: 'Тамбур · дверь закрыта', route: 6, character: 'narrator', dialogue: ['Внутренний голос', 'Ты хотел объяснить себя. Но для Маши это прозвучало как очередное оправдание.'], choices: null, next: 'final_scene' },
      crisis_tragedy: { chapter: 'Срыв', location: 'Техническая остановка · холодный свет', route: 6, character: 'radio', dialogue: ['Рация', 'Седьмой вагон, ответьте. Что у вас происходит?'], choices: null, next: 'final_scene' },
      final_scene: { chapter: 'Финал', location: 'Утро · дверь вагона', route: 7, character: 'nina', dialogue: ['Нина Павловна', 'Ну что, Артём. Первый рейс закончился. Как сам думаешь — справился?'], choices: null, final: true }
    };

    const SCENE_PHOTO_INDEX_BY_ID = {
      prologue: 1,

      boarding: 2,
      boarding_help: 2,
      boarding_aside: 2,
      boarding_rude: 2,

      chapter_wagon: 3,

      masha_document: 4,
      masha_honest: 4,
      masha_hidden: 4,
      masha_pressure: 4,
      crisis_masha: 4,
      crisis_masha_apology: 4,
      crisis_masha_job: 4,
      crisis_masha_excuse: 4,

      oleg_intro: 5,
      oleg_talk: 5,
      oleg_report: 5,
      oleg_ignore: 5,
      oleg_humiliate: 5,

      child_conflict: 6,
      child_help: 6,
      child_corridor: 6,
      child_ignore: 6,
      child_strict: 6,

      ilya_night: 7,

      inspector: 8,
      inspector_good: 8,
      inspector_problem: 8,
      
      pre_crisis: 9,

      crisis_oleg: 10,
      crisis_oleg_talk: 10,
      crisis_oleg_help: 10,
      crisis_oleg_rough: 10,
      crisis_tragedy: 10,

      crisis_ilya: 11,
      crisis_ilya_help: 11,
      crisis_ilya_self: 11,
      crisis_ilya_doubt: 11,

      final_scene: 12
    };

    const STORY_SCENE_IDS = Object.keys(scenes);
    STORY_SCENE_IDS.forEach((sceneId, index) => {
      scenes[sceneId].story = scenes[sceneId].story || ACTIVE_STORY;
      scenes[sceneId].photoIndex = scenes[sceneId].photoIndex || SCENE_PHOTO_INDEX_BY_ID[sceneId] || index + 1;
    });
  const ENDINGS = {
  provodnik: {
    title: 'Проводник',
    text: 'Артём справился с первым рейсом. Не потому что всё сделал идеально, а потому что видел людей, не скрывал ошибки и не ушёл от кризиса.'
  },

  po_raspisaniyu: {
    title: 'По расписанию',
    text: 'Рейс завершён. Формально всё доведено до конца, но в решениях Артёма было больше порядка, чем живого участия. Следующий рейс должен быть сильнее.'
  },

  ne_dopushen: {
    title: 'Не допущен',
    text: 'Форма оказалась тяжелее, чем Артём думал. Он слишком часто прятался за неё, когда рядом были живые люди.'
  },

  oboydetsya: {
    title: 'Обойдётся',
    text: 'Техническая остановка. Холодный свет. Рация трещит. Самая опасная фраза в этой работе оказалась простой: “я думал, обойдётся”.'
  },

  vtoroy_shans: {
    title: 'Следующий рейс',
    text: 'Артём ошибался, но не провалил рейс. Он смог признать часть решений, удержать кризис и получить право на следующий рейс.'
  }
};
window.GameData = {
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
};
    })();
