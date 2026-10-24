/**
 * S·I SKIN MATCH™ · treatment-match questionnaire
 * Four questions → one in-clinic treatment direction. Runs entirely in the browser; nothing is sent or stored.
 * Public API (used by page buttons): window.openSkinMatch(), window.closeSkinMatch(), window.restartSkinMatch()
 */
(function () {
  'use strict';
  var D = document;
  var modal = D.getElementById('skin-match-modal');
  if (!modal) return;
  var dialog = modal.querySelector('.sm-dialog');
  var stage = D.getElementById('sm-stage');
  var countEl = D.getElementById('sm-count');
  var backBtn = D.getElementById('sm-back');
  var progress = D.getElementById('sm-progress');
  var profileEl = D.getElementById('sm-profile');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA = '972559958106';

  var QUESTIONS = [
    { key: 'zone', label: 'אזור מיקוד',
      title: 'באיזה אזור בפנים נדרש עיקר המיקוד?',
      desc: 'בחר את האזור שבו מה שמפריע לך בולט ביותר.',
      opts: [
        { v: 'tzone', t: 'מצח ואף (אזור ה־T)', s: 'אזור T ומצח', d: 'ברק ושומניות במהלך היום, נקבוביות חסומות ושחורים.' },
        { v: 'cheeks', t: 'לחיים ומרכז הפנים', s: 'לחיים', d: 'חספוס, גוון לא אחיד, כתמי שמש או יובש מקומי.' },
        { v: 'jawline', t: 'קו הלסת, הצוואר ואזור הגילוח', s: 'קו הלסת והגילוח', d: 'אדמומיות וצריבה אחרי גילוח, פצעי גילוח וגירוי חוזר.' },
        { v: 'full', t: 'כל הפנים', s: 'כל הפנים', d: 'טיפול כולל לאיזון המרקם, ניקוי ורעננות.' }
      ] },
    { key: 'condition', label: 'מצב העור',
      title: 'איך העור מרגיש ביומיום?',
      desc: 'התחושה השלטת רוב הזמן, לא ביום חריג.',
      opts: [
        { v: 'oily', t: 'שומני ומבריק', s: 'שומני', d: 'מבריק כבר בצהריים, נקבוביות בולטות ונטייה לפצעונים.' },
        { v: 'dry', t: 'יבש ומתוח', s: 'יבש ומתוח', d: 'מתיחות אחרי מקלחת, חספוס במגע וקווי יובש ראשונים.' },
        { v: 'redness', t: 'רגיש, אדמומי ונצרב', s: 'רגיש ואדמומי', d: 'צריבה ואדמומיות, בעיקר אחרי גילוח.' },
        { v: 'dull', t: 'עמום ועייף', s: 'עמום', d: 'גוון לא אחיד, כתמים מהשמש ומראה עייף.' }
      ] },
    { key: 'habit', label: 'שגרה',
      title: 'מה הכי משפיע על העור שלך?',
      desc: 'הרגל או סביבה שחוזרים על עצמם כמעט כל יום.',
      opts: [
        { v: 'daily_blade', t: 'גילוח יומי בסכין', s: 'גילוח יומי', d: 'חיכוך חוזר שמחליש את שכבת ההגנה של העור.' },
        { v: 'electric_beard', t: 'מכונה או זקן מעוצב', s: 'זקן ומכונה', d: 'קווי מתאר קבועים, שערות חודרות וזקיקים חסומים.' },
        { v: 'sweat_sport', t: 'אימונים והזעה', s: 'אימונים והזעה', d: 'זיעה, מלחים וחיכוך שנשארים על העור.' },
        { v: 'sun_outdoor', t: 'הרבה זמן בשמש', s: 'חשיפה לשמש', d: 'עבודה או פעילות בחוץ, שמש בלי הגנה קבועה.' }
      ] },
    { key: 'goal', label: 'מטרה',
      title: 'מה התוצאה שאתה רוצה לצאת איתה?',
      desc: 'המטרה העיקרית לטיפול בקליניקה.',
      opts: [
        { v: 'deep_clean', t: 'ניקוי עמוק ואיזון שומן', s: 'ניקוי ואיזון', d: 'נקבוביות נקיות, פחות ברק ופחות פצעונים.' },
        { v: 'glow_texture', t: 'מרקם חלק ועור זוהר', s: 'מרקם וזוהר', d: 'עור רענן, אחיד וחיוני יותר.' },
        { v: 'barrier_repair', t: 'הרגעה ושיקום', s: 'הרגעה ושיקום', d: 'פחות אדמומיות וצריבה, עור שמחזיק בגילוח הבא.' },
        { v: 'event_prep', t: 'רענון לפני אירוע', s: 'לפני אירוע', d: 'מראה רענן באותו היום, בלי אדמומיות ובלי זמן החלמה.' }
      ] }
  ];

  var PROTOCOLS = {
    clean: {
      en: 'Deep cleanse & balance',
      title: 'ניקוי עמוק ואיזון שומן',
      desc: 'טיפול יסודי לעור שמן ולנקבוביות חסומות: ניקוי מדויק, פילינג לאיזון השומן ואור כחול להרגעה.',
      steps: [
        ['אבחון', 'בדיקת העור והנקבוביות תחת זכוכית מגדלת.'],
        ['ריכוך', 'ריכוך שכבת העור העליונה כדי לפתוח חסימות בעדינות.'],
        ['ניקוי', 'הוצאת שחורים וניקוי עמוק, מבוקר ונקי, בלי לפגוע בעור.'],
        ['פילינג BHA', 'חומצה סליצילית לאיזון הפרשת השומן.'],
        ['אור כחול', 'LED באורך גל 415nm להרגעת העור ולצמצום פצעונים.'],
        ['מסכה', 'מסכת חימר לספיגת עודפי שומן ולמראה נקבוביות מצומצם.']
      ],
      perks: ['חוזרים לשגרה מיד', 'ללא אדמומיות ממושכת', 'חומרים פעילים בריכוז מקצועי']
    },
    barrier: {
      en: 'Barrier repair & calm',
      title: 'הרגעה ושיקום אחרי גילוח',
      desc: 'טיפול שיקומי לעור רגיש: מרגיע צריבה ואדמומיות ומחזק את שכבת ההגנה של העור לקראת הגילוח הבא.',
      steps: [
        ['אבחון', 'הערכת מצב העור ואיתור אזורי גירוי ופצעי גילוח.'],
        ['ניקוי עדין', 'ניקוי אנזימטי בלי שפשוף, כדי לא להוסיף גירוי.'],
        ['שיקום', 'סרמידים וליפידים שמחזקים את שכבת ההגנה הטבעית.'],
        ['הרגעה', 'תמציות צמחיות ואבץ להפחתת תחושת הצריבה.'],
        ['מסכה קרה', 'מסכה מקררת שמורידה אדמומיות כבר בחדר.'],
        ['שגרה', 'הנחיות אישיות לגילוח שמפחית גירוי.']
      ],
      perks: ['הקלה בצריבה כבר בטיפול', 'תכשירים ללא בישום ואלכוהול', 'עור עמיד יותר לגילוח']
    },
    glow: {
      en: 'Texture renewal & glow',
      title: 'חידוש מרקם וזוהר',
      desc: 'טיפול לרענון העור: מסיר את השכבה העמומה, מחדיר לחות ומחזיר לעור גוון אחיד ומראה חיוני.',
      steps: [
        ['אבחון', 'בדיקת מרקם העור, כתמים ונזקי שמש.'],
        ['פילינג', 'ניקוי ופילינג AHA בריכוז מותאם להסרת תאים עמומים.'],
        ['לחות', 'סרום חומצה היאלורונית ונוגדי חמצון.'],
        ['עיסוי', 'עיסוי לימפטי שמרענן ומפחית נפיחות.'],
        ['אור אדום', 'LED באורך גל 630nm לתמיכה במרקם העור.'],
        ['גימור', 'לחות קלה, תוצאה נקייה ורעננה בלי ברק שומני.']
      ],
      perks: ['אפשר באותו יום של אירוע', 'ללא זמן החלמה', 'מראה טבעי, לא מלאכותי']
    }
  };

  var NOTES = {
    daily_blade: 'בגלל הגילוח היומי, נעבור יחד גם על שגרת גילוח שמפחיתה גירוי.',
    electric_beard: 'בגלל הזקן והמכונה, נקפיד במיוחד על אזור קו הזקן ועל זקיקים חסומים.',
    sweat_sport: 'בגלל האימונים, נתאים לך שגרת ניקוי קצרה לאחרי אימון.',
    sun_outdoor: 'בגלל החשיפה לשמש, נדבר על הגנה יומית שמתאימה לך.'
  };

  var answers = {}, step = 0, lastFocus = null, timer = 0;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function opt(q, v) { for (var i = 0; i < q.opts.length; i++) if (q.opts[i].v === v) return q.opts[i]; return null; }

  function pickProtocol() {
    var a = answers;
    if (a.condition === 'redness' || a.goal === 'barrier_repair' || (a.habit === 'daily_blade' && a.condition === 'dry')) return PROTOCOLS.barrier;
    if (a.goal === 'glow_texture' || a.goal === 'event_prep' || a.condition === 'dull' || (a.zone === 'cheeks' && a.condition !== 'oily')) return PROTOCOLS.glow;
    return PROTOCOLS.clean;
  }

  /* ---------- side panel ---------- */
  function renderProfile() {
    profileEl.innerHTML = QUESTIONS.map(function (q, i) {
      var o = opt(q, answers[q.key]);
      var cls = o ? 'is-set' : (i === step ? 'is-now' : '');
      return '<li class="' + cls + '"><span class="n" dir="ltr">' + pad(i + 1) + '</span><span class="k">' + q.label + '</span><span class="v">' + (o ? esc(o.s) : '—') + '</span></li>';
    }).join('');
    var z = answers.zone;
    [].forEach.call(modal.querySelectorAll('[data-zone]'), function (el) {
      el.classList.toggle('is-on', !!z && (z === 'full' || el.getAttribute('data-zone') === z));
    });
  }

  function setProgress(i) {
    var done = i >= QUESTIONS.length;
    progress.hidden = done;
    if (!done) {
      countEl.innerHTML = '<b>' + pad(i + 1) + '</b> / ' + pad(QUESTIONS.length);
      [].forEach.call(progress.querySelectorAll('.sm-seg li'), function (li, k) { li.className = k < i ? 'done' : (k === i ? 'now' : ''); });
      backBtn.hidden = i === 0;
    }
  }

  /* ---------- question ---------- */
  function renderQuestion(i, focus) {
    step = i;
    var q = QUESTIONS[i];
    stage.innerHTML =
      '<div class="sm-q" role="group" aria-labelledby="sm-q-title">' +
        '<p class="sm-eyebrow">שאלה ' + (i + 1) + ' מתוך ' + QUESTIONS.length + '</p>' +
        '<h3 class="sm-q-title" id="sm-q-title" tabindex="-1">' + q.title + '</h3>' +
        '<p class="sm-q-desc">' + q.desc + '</p>' +
        '<div class="sm-opts">' + q.opts.map(function (o, k) {
          var on = answers[q.key] === o.v;
          return '<button type="button" class="sm-opt' + (on ? ' is-on' : '') + '" aria-pressed="' + on + '" data-v="' + o.v + '">' +
            '<span class="sm-opt-mark" aria-hidden="true"></span>' +
            '<span class="sm-opt-body"><strong>' + o.t + '</strong><span>' + o.d + '</span></span>' +
          '</button>';
        }).join('') + '</div>' +
      '</div>';
    setProgress(i); renderProfile();
    if (focus) { var t = stage.querySelector('.sm-opt.is-on') || stage.querySelector('.sm-opt'); if (t) t.focus({ preventScroll: true }); }
    stage.scrollTop = 0; var m = stage.closest('.sm-main'); if (m) m.scrollTop = 0;
  }

  function choose(v, btn) {
    var q = QUESTIONS[step];
    answers[q.key] = v;
    [].forEach.call(stage.querySelectorAll('.sm-opt'), function (b) { var on = b === btn; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
    renderProfile();
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (step < QUESTIONS.length - 1) renderQuestion(step + 1, true);
      else showResult();
    }, reduce ? 60 : 280);
  }

  /* ---------- result ---------- */
  function showResult() {
    step = QUESTIONS.length;
    setProgress(step); renderProfile();
    stage.innerHTML = '<div class="sm-loading" role="status"><svg viewBox="0 0 24 32" aria-hidden="true"><path d="M3 31V12a9 9 0 0 1 18 0v19"/></svg><p>בונה את ההתאמה שלך</p></div>';
    clearTimeout(timer);
    timer = setTimeout(renderResult, reduce ? 50 : 900);
  }

  function renderResult() {
    var p = pickProtocol();
    var picks = QUESTIONS.map(function (q) { var o = opt(q, answers[q.key]); return o ? o.s : ''; }).filter(Boolean);
    var note = NOTES[answers.habit] || '';
    var wa = 'היי ישראל, עשיתי את שאלון ההתאמה באתר.\n' +
      'ההמלצה: ' + p.title + '\n' +
      QUESTIONS.map(function (q) { var o = opt(q, answers[q.key]); return q.label + ': ' + (o ? o.t : '—'); }).join('\n') +
      '\nאשמח לתאם בדיקת עור וטיפול.';
    var link = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(wa);

    stage.innerHTML =
      '<article class="sm-res">' +
        '<p class="sm-eyebrow">ההתאמה שלך<span lang="en" dir="ltr">' + p.en + '</span></p>' +
        '<h3 class="sm-res-title" id="sm-res-title" tabindex="-1">' + p.title + '</h3>' +
        '<p class="sm-res-desc">' + p.desc + '</p>' +
        '<div class="sm-why"><span class="sm-why-k">לפי מה שבחרת</span><ul>' + picks.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></div>' +
        '<h4 class="sm-h4">מהלך הטיפול</h4>' +
        '<ol class="sm-steps">' + p.steps.map(function (s, i) {
          return '<li><span class="n" dir="ltr">' + pad(i + 1) + '</span><span class="t"><strong>' + s[0] + '</strong>' + s[1] + '</span></li>';
        }).join('') + '</ol>' +
        '<ul class="sm-perks">' + p.perks.map(function (s) {
          return '<li><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' + s + '</li>';
        }).join('') + '<li><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>חדר סגור, אחד על אחד</li></ul>' +
        (note ? '<p class="sm-note">' + note + '</p>' : '') +
        '<div class="sm-cta">' +
          '<a class="sm-btn" href="' + link + '" target="_blank" rel="noopener"><span class="sm-wa-dot" aria-hidden="true"></span>לתיאום בוואטסאפ <span aria-hidden="true">←</span></a>' +
          '<button type="button" class="sm-btn ghost" data-sm-restart>מילוי מחדש</button>' +
        '</div>' +
        '<p class="sm-fine">זו התאמה ראשונית לפי התשובות שלך, לא אבחנה רפואית. הטיפול נקבע סופית אחרי בדיקת עור בקליניקה.</p>' +
      '</article>';
    var h = D.getElementById('sm-res-title'); if (h) h.focus({ preventScroll: true });
  }

  /* ---------- open / close ---------- */
  function restart(focus) { clearTimeout(timer); answers = {}; renderQuestion(0, focus); }
  window.openSkinMatch = function () {
    lastFocus = D.activeElement;
    modal.hidden = false; void modal.offsetHeight; modal.classList.add('is-active');
    D.documentElement.classList.add('sm-lock');
    if (step >= QUESTIONS.length || !stage.firstChild) restart(false);
    setTimeout(function () { var t = stage.querySelector('.sm-opt.is-on') || stage.querySelector('.sm-opt') || dialog; t.focus({ preventScroll: true }); }, 60);
  };
  window.closeSkinMatch = function () {
    modal.classList.remove('is-active');
    D.documentElement.classList.remove('sm-lock');
    setTimeout(function () { modal.hidden = true; }, reduce ? 0 : 300);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  };
  window.restartSkinMatch = function () { restart(true); };

  modal.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : e.target.parentNode;
    if (t.closest('[data-sm-close]')) { window.closeSkinMatch(); return; }
    if (t.closest('[data-sm-restart]')) { restart(true); return; }
    var b = t.closest('.sm-opt'); if (b) choose(b.getAttribute('data-v'), b);
  });
  backBtn.addEventListener('click', function () { if (step > 0) renderQuestion(step - 1, true); });
  D.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('is-active')) return;
    if (e.key === 'Escape') { e.preventDefault(); window.closeSkinMatch(); return; }
    if (e.key !== 'Tab') return;
    var f = [].filter.call(dialog.querySelectorAll('button:not([hidden]),a[href],[tabindex="0"]'), function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (D.activeElement === first || !dialog.contains(D.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (D.activeElement === last || !dialog.contains(D.activeElement))) { e.preventDefault(); first.focus(); }
  });

  renderQuestion(0, false);
})();
