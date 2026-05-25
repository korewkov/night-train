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
      if (state.tragedyFlag) return 'crisis_tragedy';
      if (state.ignoredOleg || state.humiliatedOleg || state.olegTrust < 0) return 'crisis_oleg';
      if (state.alienatedIlya || state.ilyaTrust < 0 || state.empathy < 0) return 'crisis_ilya';
      if (!state.mashaDocumentFixed && (state.betrayedMasha || state.pressuredMasha || state.mashaTrust < -1)) return 'crisis_masha';
      if (state.olegTrust >= 1) return 'crisis_oleg';
      if (state.helpedIlya) return 'crisis_ilya';
      return 'crisis_masha';
    }

    function getEndingStats() {
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
      return { humanWins, seriousMistakes, moralBalance, formalScore };
    }

    function getEnding() {
      const stats = getEndingStats();
      if (state.fatalDocumentViolation) return 'ne_dopushen';
      if (state.tragedyFlag || (!state.crisisResolved && state.courage <= -2 && state.discipline <= 0)) return 'oboydetsya';
      if (state.conscience <= -3 && state.empathy <= -2) return 'ne_dopushen';

      if (state.crisisResolved && stats.humanWins >= 4 && stats.moralBalance >= 5 && stats.seriousMistakes <= 1) return 'provodnik';
      if (state.crisisResolved && stats.humanWins >= 3 && stats.moralBalance >= 2) return 'vtoroy_shans';
      if (state.crisisResolved && stats.seriousMistakes <= 2 && stats.moralBalance >= 0) return 'vtoroy_shans';

      return 'po_raspisaniyu';
    }

    function getRank() {
      const ending = state.endingType || getEnding();
      const labels = { provodnik: 'Проводник', vtoroy_shans: 'Второй шанс', ne_dopushen: 'Не допущен', oboydetsya: 'Рейс сорван', po_raspisaniyu: 'По расписанию' };
      return labels[ending] || 'Артём';
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
      const remarks = [];
      const ending = state.endingType || getEnding();
      const endingRemarks = {
        provodnik: { icon: '⭐', title: 'Ты довёз не поезд. Ты довёз людей', text: 'Артём не спрятался в кризисе, сохранил человечность и взял ответственность за свои решения.', level: 'low' },
        vtoroy_shans: { icon: '🧭', title: 'Ошибки признаны', text: 'Первый рейс не сделал Артёма идеальным, но он перестал прятаться за форму и получил второй шанс.', level: 'mid' },
        po_raspisaniyu: { icon: '🚆', title: 'Поезд прибыл вовремя', text: 'Рейс доведён до конца, но решения были больше про порядок, чем про доверие. Это не провал, но и не сильная смена.', level: 'mid' },
        ne_dopushen: { icon: '🚫', title: 'Форма не делает человеком', text: 'Артём слишком часто выбирал самосохранение, ложь или холодность вместо ответственности.', level: 'high' },
        oboydetsya: { icon: '🌑', title: 'Остановка в темноте', text: 'Бездействие в кризисе привело к трагической ветке. В этой работе “обойдётся” — самая опасная фраза.', level: 'high' }
      };
      remarks.push(endingRemarks[ending] || endingRemarks.po_raspisaniyu);
      if (state.helpedIlya) remarks.push({ icon: '🧓', title: 'Илья Семёнович доверился', text: 'На посадке Артём не стал давить на слабого пассажира и помог без унижения.', level: 'low' });
      if (state.mashaDocumentFixed) remarks.push({ icon: '📄', title: 'Документы Маши исправлены правильно', text: 'Артём не стал скрывать ошибку и передал ситуацию начальнику поезда. На ревизии проблем не возникло.', level: 'low' });
      if (state.olegTrust >= 1) remarks.push({ icon: '🪟', title: 'Олег не остался один', text: 'Артём заметил напряжение раньше кризиса и не превратил пассажира во врага.', level: 'low' });
      if (state.childDrawing) remarks.push({ icon: '🖍️', title: 'Ребёнок запомнил голос, который не ругался', text: 'Эмпатия стала не слабостью, а способом удержать вагон.', level: 'low' });
      if (state.fatalDocumentViolation) remarks.push({ icon: '📄', title: 'Критическая ошибка с документами', text: 'Пассажир был пропущен без корректного исправления данных. Это фатальное нарушение для проводника.', level: 'high' });
      if (state.betrayedMasha) remarks.push({ icon: '📄', title: 'Маша была предана', text: 'В момент давления Артём переложил ответственность на пассажирку.', level: 'high' });
      if (state.alienatedIlya) remarks.push({ icon: '🧳', title: 'Посадка прошла быстро, но холодно', text: 'Порядок был сохранён, но пожилой пассажир почувствовал себя лишним.', level: 'mid' });
      if (state.ignoredOleg || state.humiliatedOleg) remarks.push({ icon: '🍾', title: 'Олег дошёл до кризиса', text: 'Проблема не исчезла, когда Артём решил её не видеть или унизил человека.', level: 'high' });
      if (state.crisisResolved) remarks.push({ icon: '🛟', title: 'Финальный кризис удержан', text: 'В конце рейса Артём не ушёл от ответственности и помог остановить срыв ситуации.', level: 'low' });
      if (state.admittedMistake) remarks.push({ icon: '✓', title: 'Ошибка признана', text: 'Честность ухудшила формальную позицию, но сохранила человеческую.', level: 'low' });
      return remarks.slice(0, 7);
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
      const endings = {
        provodnik: ['Проводник', 'Артём справился с первым рейсом. Не потому что всё сделал идеально, а потому что видел людей, не скрывал ошибки и не ушёл от кризиса.'],
        po_raspisaniyu: ['По расписанию', 'Рейс завершён. Формально всё доведено до конца, но в решениях Артёма было больше порядка, чем живого участия. Следующий рейс должен быть сильнее.'],
        ne_dopushen: ['Не допущен', 'Форма оказалась тяжелее, чем Артём думал. Он слишком часто прятался за неё, когда рядом были живые люди.'],
        oboydetsya: ['Обойдётся', 'Техническая остановка. Холодный свет. Рация трещит. Самая опасная фраза в этой работе оказалась простой: “я думал, обойдётся”.'],
        vtoroy_shans: ['Следующий рейс', 'Артём ошибался, но не провалил рейс. Он смог признать часть решений, удержать кризис и получить право на следующий рейс.']
      };
      const data = endings[state.endingType] || endings.po_raspisaniyu;
      byId('endingTitle').textContent = data[0];
      byId('endingText').textContent = data[1];
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
