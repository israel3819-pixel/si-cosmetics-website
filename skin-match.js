/**
 * S·I SKIN MATCH™ — CLINICAL DIAGNOSTIC CONTROLLER
 * Men's Aesthetic Clinic | Florentin, Tel Aviv
 * Exclusively In-Clinic Protocols (Treatments Only, No Products)
 * 100% Client-Side Interactive Logic (Zero Fake Facial Photo Scans)
 */

(function initSkinMatchModule() {
  'use strict';

  const state = {
    step: 1,
    answers: {
      zone: null,
      condition: null,
      habit: null,
      goal: null
    }
  };

  const modal = document.getElementById('skin-match-modal');
  const progressBar = document.getElementById('sm-progress-bar');
  const stepCounter = document.getElementById('sm-step-counter');
  const prevBtn = document.getElementById('sm-prev-step-btn');

  // Side A: Clinical Telemetry Elements
  const valZone = document.getElementById('sm-val-zone');
  const valCondition = document.getElementById('sm-val-condition');
  const valHabit = document.getElementById('sm-val-habit');
  const valGoal = document.getElementById('sm-val-goal');
  const valProtocol = document.getElementById('sm-val-protocol');

  // Focal HUD Target Elements (Wireframe SVG)
  const targetTZone = document.getElementById('hud-target-tzone');
  const targetCheeks = document.getElementById('hud-target-cheeks');
  const targetBeard = document.getElementById('hud-target-beard');

  window.openSkinMatch = function openSkinMatch() {
    if (!modal) return;
    modal.removeAttribute('hidden');
    void modal.offsetHeight;
    modal.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  };

  window.closeSkinMatch = function closeSkinMatch() {
    if (!modal) return;
    modal.classList.remove('is-active');
    document.body.style.overflow = '';
    setTimeout(() => {
      modal.setAttribute('hidden', '');
    }, 350);
  };

  // Keyboard accessibility
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('is-active')) {
      window.closeSkinMatch();
    }
  });

  window.selectSmOption = function selectSmOption(step, val, btnEl) {
    const container = btnEl.closest('.sm-options-grid');
    if (container) {
      container.querySelectorAll('.sm-option-card').forEach(card => card.classList.remove('is-selected'));
    }
    btnEl.classList.add('is-selected');

    if (step === 1) {
      state.answers.zone = val;
      updateTelemetryStep1(val);
      setTimeout(() => advanceToStep(2), 240);
    } else if (step === 2) {
      state.answers.condition = val;
      updateTelemetryStep2(val);
      setTimeout(() => advanceToStep(3), 240);
    } else if (step === 3) {
      state.answers.habit = val;
      updateTelemetryStep3(val);
      setTimeout(() => advanceToStep(4), 240);
    } else if (step === 4) {
      state.answers.goal = val;
      updateTelemetryStep4(val);
      setTimeout(() => calculateSkinMatch(), 240);
    }
  };

  function updateTelemetryStep1(val) {
    if (!targetTZone || !targetCheeks || !targetBeard) return;

    if (val === 'tzone') {
      targetTZone.classList.add('is-focused');
      targetCheeks.classList.remove('is-focused');
      targetBeard.classList.remove('is-focused');
      if (valZone) valZone.textContent = 'T-ZONE & FOREHEAD';
    } else if (val === 'cheeks') {
      targetCheeks.classList.add('is-focused');
      targetTZone.classList.remove('is-focused');
      targetBeard.classList.remove('is-focused');
      if (valZone) valZone.textContent = 'CHEEKS / MALAR REGION';
    } else if (val === 'jawline') {
      targetBeard.classList.add('is-focused');
      targetTZone.classList.remove('is-focused');
      targetCheeks.classList.remove('is-focused');
      if (valZone) valZone.textContent = 'MANDIBULAR & SHAVE AREA';
    } else if (val === 'full') {
      targetTZone.classList.add('is-focused');
      targetCheeks.classList.add('is-focused');
      targetBeard.classList.add('is-focused');
      if (valZone) valZone.textContent = 'FULL FACIAL COMPLEX';
    }
  }

  function updateTelemetryStep2(val) {
    if (!valCondition) return;
    if (val === 'oily') {
      valCondition.textContent = 'SEBUM EXCESS (+45%) / CONGESTED';
    } else if (val === 'dry') {
      valCondition.textContent = 'LIPID DEFICIT / TIGHT EPIDERMIS';
    } else if (val === 'redness') {
      valCondition.textContent = 'ACUTE ERYTHEMA / BARRIER STRESS';
    } else if (val === 'dull') {
      valCondition.textContent = 'KERATIN STAGNATION / UV DULLNESS';
    }
  }

  function updateTelemetryStep3(val) {
    if (!valHabit) return;
    if (val === 'daily_blade') {
      valHabit.textContent = 'BLADE FRICTION / MICRO-ABRASION';
    } else if (val === 'electric_beard') {
      valHabit.textContent = 'FOLLICULAR KERATOSIS TENDENCY';
    } else if (val === 'sweat_sport') {
      valHabit.textContent = 'SWEAT & SALT ACCUMULATION';
    } else if (val === 'sun_outdoor') {
      valHabit.textContent = 'PHOTO-OXIDATIVE UV EXPOSURE';
    }
  }

  function updateTelemetryStep4(val) {
    if (!valGoal) return;
    if (val === 'deep_clean') {
      valGoal.textContent = 'SEBUM PURIFICATION & EXTRACTION';
    } else if (val === 'glow_texture') {
      valGoal.textContent = 'CELLULAR RENEWAL & RADIANCE';
    } else if (val === 'barrier_repair') {
      valGoal.textContent = 'LIPID BARRIER RECONSTRUCTION';
    } else if (val === 'event_prep') {
      valGoal.textContent = 'EXPRESS HYDRATION & REFRESH';
    }
    if (valProtocol) valProtocol.textContent = 'SYNTHESIZING PROTOCOL...';
  }

  function advanceToStep(nextStep) {
    state.step = nextStep;

    document.querySelectorAll('.sm-step-screen').forEach(s => s.classList.remove('is-active'));
    const nextScreen = document.getElementById(`sm-step-${nextStep}`);
    if (nextScreen) nextScreen.classList.add('is-active');

    if (progressBar) {
      if (nextStep === 1) progressBar.style.width = '25%';
      else if (nextStep === 2) progressBar.style.width = '50%';
      else if (nextStep === 3) progressBar.style.width = '75%';
      else if (nextStep === 4) progressBar.style.width = '100%';
    }

    if (stepCounter) {
      stepCounter.textContent = `שלב ${nextStep} מתוך 4`;
    }

    if (prevBtn) {
      prevBtn.style.display = nextStep > 1 ? 'inline-flex' : 'none';
    }
  }

  window.smPrevStep = function smPrevStep() {
    if (state.step > 1) {
      advanceToStep(state.step - 1);
    }
  };

  function calculateSkinMatch() {
    const resultScreen = document.getElementById('sm-step-result');
    if (!resultScreen) return;

    document.querySelectorAll('.sm-step-screen').forEach(s => s.classList.remove('is-active'));
    resultScreen.classList.add('is-active');

    if (stepCounter) {
      stepCounter.textContent = 'התאמת כיוון טיפולי';
    }
    if (prevBtn) {
      prevBtn.style.display = 'none';
    }

    resultScreen.innerHTML = `
      <div class="sm-loading-box">
        <div class="sm-loader-spinner"></div>
        <div class="mono" style="color:var(--sm-amber); font-size:12px; letter-spacing:0.14em;">CALCULATING SKIN MATCH...</div>
        <div style="font-size:17px; font-weight:700; color:var(--sm-text);">מתאים את הפרוטוקול הנכון עבורך...</div>
      </div>
    `;

    setTimeout(() => {
      renderSkinMatchResult(resultScreen);
    }, 550);
  }

  function renderSkinMatchResult(container) {
    const { zone, condition, habit, goal } = state.answers;

    // Clinical Logic (TREATMENTS ONLY, NO PRODUCTS)
    let protocol = {
      title: "פרוטוקול ניקוי עמוק, ויסות סבום ופוטותרפיה כחולה",
      category: "פרוטוקול ניקוי ואיזון סבום · עור שמן, נקבוביות ואקנה",
      desc: "טיפול קליני יסודי בחדר פרטי וסגור (1-על-1). מיועד לגברים הסובלים משומניות יתר, ברק באזור המצח והאף, ונקבוביות חסומות.",
      steps: [
        "בדיקת מגע ובדיקת עומק הנקבוביות בעדשה אופטית ייעודית.",
        "ריכוך שכבת הקרנית והמסת קומדונים (שחורים) מבוקרת ללא פציעה או צלקות.",
        "ניקוי עמוק וניקוז שומני עדין, מדויק וסטרילי.",
        "פילינג חומצות BHA (חומצה סליצילית) רפואי לוויסות הפרשת הסבום.",
        "פוטותרפיה בטכנולוגיית אור כחול (LED 415nm) לקטילת חיידקי אקנה והרגעת העור.",
        "מסכת חימר טהורה ומינרלים לספיגת עודפי שומן וכיווץ נקבוביות."
      ],
      perks: [
        "חדר טיפולים פרטי וסגור 1-על-1 ללא נוכחים נוספים",
        "חומרים פעילים בריכוז קליני גבוה",
        "ללא אדמומיות ממושכת — חזרה מיידית לשגרה"
      ]
    };

    if (condition === 'redness' || goal === 'barrier_repair' || (habit === 'daily_blade' && condition === 'dry')) {
      protocol = {
        title: "פרוטוקול שיקום מחסום עור לאחר גילוח והרגעת אדמומיות",
        category: "פרוטוקול שיקום מחסום עור · רגישות, צריבה ורוזציאה",
        desc: "טיפול שיקומי מעמיק בחדר פרטי וסגור (1-על-1). מיועד לגברים הסובלים מרגישות גבוהה, צריבה לאחר גילוח, פוליקוליטיס ונטייה לאדמומיות.",
        steps: [
          "הערכת שלמות מחסום העור וזיהוי מוקדי פוליקוליטיס וגירוי זקיקי שערה.",
          "ניקוי אנזימטי עדין ללא שפשוף מכני למניעת גירוי נוסף.",
          "החדרת קומפלקס סרמידים וליפידים ביו-מימטיים לשחזור מעטפת ההגנה הטבעית.",
          "טיפול בתמציות בוטניות נוגדות דלקת ואבץ פעיל להרגעת תחושת הבערה.",
          "מסכת קירור טיפולית (Cryo-soothing) להורדה מיידית של אדמומיות מקומית.",
          "הנחיות קליניות אישיות לשגרת גילוח נכונה ולמניעת גירויים עתידיים."
        ],
        perks: [
          "הקלה מיידית בתחושת השריפה והצריבה",
          "חיזוק עמידות העור לגילוח הבא",
          "תכשירים נטולי בישום, אלכוהול או אלרגנים"
        ]
      };
    } else if (goal === 'glow_texture' || goal === 'event_prep' || condition === 'dull' || (zone === 'cheeks' && condition !== 'oily')) {
      protocol = {
        title: "פרוטוקול אסתטיקה וחידוש מרקם GLOW",
        category: "פרוטוקול אחידות גוון וחידוש · עור עמום, כתמים ואירוע",
        desc: "טיפול מדויק בחדר פרטי וסגור (1-על-1). מיועד לחידוש מרקם העור, הבהרת כתמי שמש, החזרת רעננות וברק טבעי לפני אירועים ופגישות.",
        steps: [
          "בדיקת עומק מרקם העור ורמת הפיגמנטציה ונזקי השמש המצטברים.",
          "ניקוי אפידרמלי עדין ופילינג ביולוגי/AHA בריכוז מותאם להסרת תאים עמומים.",
          "החדרת סרום חומצה היאלורונית רב-משקלית וקומפלקס ויטמינים נוגדי חמצון.",
          "עיסוי לימפטי ממריץ ומנקז נוזלים להחזרת חיוניות וטונוס שרירי הפנים.",
          "פוטותרפיה באור אדום (LED 630nm) להמרצת ייצור הקולגן והאלסטין.",
          "גימור בלחות משקמת קלת משקל — תוצאת GLOW נקייה ורעננה ללא ברק שומני."
        ],
        perks: [
          "חדר טיפולים פרטי וסגור 1-על-1",
          "תוצאת רעננות וזוהר טבעי ללא מראה שומני או מלאכותי",
          "מתאים במיוחד לפני פגישות חשובות ואירועים (0 זמן החלמה)"
        ]
      };
    }

    if (valProtocol) {
      valProtocol.textContent = protocol.title;
      valProtocol.style.color = '#22C55E';
    }

    const zoneLabels = {
      tzone: 'אזור ה-T והמצח',
      cheeks: 'לחיים ומרכז הפנים',
      jawline: 'קו הלסת, הצוואר ואזור הגילוח',
      full: 'כל הפנים (התאמה מקיפה)'
    };

    const conditionLabels = {
      oily: 'שומני, מבריק ונקבוביות חסומות',
      dry: 'יבש, מתוח וחסר גמישות',
      redness: 'אדמומיות, צריבה ורגישות לאחר גילוח',
      dull: 'גוון עמום, כתמי שמש ועייפות'
    };

    const habitLabels = {
      daily_blade: 'גילוח יומיומי בסכין',
      electric_beard: 'מכונה או זקן מעוצב',
      sweat_sport: 'אימונים אינטנסיביים והזעה',
      sun_outdoor: 'חשיפה מרובה לשמש'
    };

    const goalLabels = {
      deep_clean: 'ניקוי עמוק ואיזון שומן',
      glow_texture: 'חידוש מרקם, זוהר ורענון GLOW',
      barrier_repair: 'שיקום מחסום העור והרגעת גירוי',
      event_prep: 'רענון ממוקד לפני אירוע'
    };

    const zLabel = zoneLabels[zone] || 'לא צוין';
    const cLabel = conditionLabels[condition] || 'לא צוין';
    const hLabel = habitLabels[habit] || 'לא צוין';
    const gLabel = goalLabels[goal] || 'לא צוין';

    const waText = `היי ישראל, עשיתי התאמה אישית באתר S.I COSMETICS:
פרוטוקול מותאם: ${protocol.title}
מיקוד: ${zLabel} | מצב: ${cLabel}
שגרה: ${hLabel} | יעד: ${gLabel}
אשמח לתאם מועד לטיפול בחדר הפרטי (1-על-1).`;

    const waLink = `https://wa.me/972559958106?text=${encodeURIComponent(waText)}`;

    if (stepCounter) {
      stepCounter.textContent = 'פרוטוקול טיפול מותאם אישית';
    }

    container.innerHTML = `
      <div class="sm-result-card">
        <div class="sm-result-badge-wrap">
          <span class="sm-result-pill">SKIN MATCH COMPLETED · ההתאמה הראשונית שלך</span>
          <span class="mono" style="font-size:11px; color:var(--sm-amber);">${protocol.category}</span>
        </div>

        <div>
          <span class="sm-kicker mono">RECOMMENDED IN-CLINIC PROTOCOL</span>
          <h2 class="sm-result-title">${protocol.title}</h2>
        </div>

        <div class="sm-clinic-box">
          <div class="sm-clinic-header">
            <span>CLINICAL PROCEDURE · מהלך הטיפול בחדר הפרטי (1-על-1)</span>
          </div>
          <p class="sm-clinic-desc">${protocol.desc}</p>
          <div class="sm-procedure-steps">
            ${protocol.steps.map((st, i) => `
              <div class="sm-step-row">
                <span class="sm-step-num mono">0${i + 1}</span>
                <span class="sm-step-text">${st}</span>
              </div>
            `).join('')}
          </div>
          <div class="sm-clinic-perks">
            ${protocol.perks.map(p => `
              <div class="sm-perk">
                <span class="sm-perk-dot"></span>
                <span>${p}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="sm-result-actions">
          <a href="${waLink}" target="_blank" rel="noopener" class="sm-wa-cta-btn">
            <span>לתיאום מועד לטיפול ב-WhatsApp (055-995-8106)</span>
            <span aria-hidden="true">←</span>
          </a>
          <button type="button" class="sm-restart-btn" onclick="window.restartSkinMatch()">
            התאמה מחדש ↺
          </button>
        </div>
      </div>
    `;
  }

  window.restartSkinMatch = function restartSkinMatch() {
    state.step = 1;
    state.answers = { zone: null, condition: null, habit: null, goal: null };
    document.querySelectorAll('.sm-option-card').forEach(c => c.classList.remove('is-selected'));
    document.querySelectorAll('.sm-hud-point').forEach(p => p.classList.remove('is-focused'));
    if (targetTZone) targetTZone.classList.add('is-focused');

    if (valZone) valZone.textContent = 'STANDBY (SELECT ZONE)';
    if (valCondition) valCondition.textContent = 'STANDBY';
    if (valHabit) valHabit.textContent = 'STANDBY';
    if (valGoal) valGoal.textContent = 'STANDBY';
    if (valProtocol) {
      valProtocol.textContent = 'MATCH ENGINE ACTIVE';
      valProtocol.style.color = 'var(--sm-amber)';
    }

    advanceToStep(1);
  };
})();
