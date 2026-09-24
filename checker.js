    // Existing S.I Cosmetics ingredient checker.

    (function initIngredientChecker() {
      const ingredientNames = {
        retinol: "רטינול / ויטמין A",
        salicylic: "חומצה סליצילית (BHA)",
        glycolic: "חומצה גליקולית / לקטית (AHA)",
        vitc: "ויטמין C טהור (L-Ascorbic)",
        niacinamide: "ניאצינמיד (ויטמין B3)",
        azelaic: "חומצה אזלאית",
        tyrosinase: "מדכאי טירוזינאז (ארבוטין/קוג'ית)",
        benzoyl: "בנזואיל פרוקסיד",
        hyaluronic: "חומצה היאלורונית וסרמידים"
      };

      const interactions = {
        "glycolic+retinol": {
          status: "danger",
          statusLabel: "קונטרה-אינדיקציה חריפה",
          title: "רטינול + חומצה גליקולית / לקטית (AHA)",
          desc: "פילינג כפול ופגיעה חריפה במחסום האפידרמלי של העור. שילוב שניהם באותו פרוטוקול מעלה דרמטית את הסיכון לאדמומיות חריפה, כוויה שטחית, רגישות לשמש וקילוף מוגזם.",
          protocol: "הנחיית בטיחות: הימנע ממריחה באותו ערב! יש להפריד לימים שונים לחלוטין או להשתמש בחומצה בבוקר וברטינול בלילה (עם מקדם הגנה חובה)."
        },
        "retinol+salicylic": {
          status: "danger",
          statusLabel: "קונטרה-אינדיקציה חריפה",
          title: "רטינול + חומצה סליצילית (BHA)",
          desc: "סכנת גירוי קיצוני, קילוף יתר ופגיעה בשכבת ההגנה העורית. שני החומרים פועלים לחידוש עמוק וייבוש שומן עורי – שימוש משותף יוביל לצריבה וגירוי עיקש.",
          protocol: "הנחיית בטיחות: מומלץ להפריד לימים שונים לחלוטין. לדוגמה: BHA פעמיים בשבוע, ורטינול בשאר הלילות."
        },
        "benzoyl+retinol": {
          status: "danger",
          statusLabel: "קונטרה-אינדיקציה חריפה",
          title: "רטינול + בנזואיל פרוקסיד",
          desc: "הבנזואיל פרוקסיד מחמצן ומנטרל את מולקולת הרטינול, ובמקביל גורם לייבוש אגרסיבי, אדמומיות וצריבה עורית ממושכת.",
          protocol: "הנחיית בטיחות: אין למרוח יחד! בנזואיל פרוקסיד בבוקר או נקודתית על פצעון, ורטינול רק בלילה."
        },
        "glycolic+salicylic": {
          status: "caution",
          statusLabel: "נדרשת זהירות והפרדה",
          title: "חומצה גליקולית (AHA) + חומצה סליצילית (BHA)",
          desc: "שילוב שני תכשירים חומציים נפרדים בו-זמנית יוצר עומס חומצי קיצוני ועלול לייבש את העור באופן דרסטי (אלא אם מדובר בפורמולה מעבדתית אחת מאוזנת).",
          protocol: "הנחיית שימוש: השתמש בימים שונים או בריווח של 24–48 שעות. לחלופין, פנה לייעוץ מקצועי להתאמת ריכוזים."
        },
        "retinol+vitc": {
          status: "caution",
          statusLabel: "נדרשת הפרדת זמנים (בוקר/ערב)",
          title: "רטינול + ויטמין C טהור",
          desc: "פרוטוקול זהב מנצח בעולם האסתטיקה – אך רק בהפרדת זמנים מדויקת. שימוש בו-זמני באותה מריחה מנטרל יעילות ועלול להוביל לגירוי בעור.",
          protocol: "הנחיית שימוש: ויטמין C כנוגד חמצון ומגן קרינה בבוקר (תחת מקדם הגנה), ורטינול לחידוש רק בלילה."
        },
        "glycolic+vitc": {
          status: "caution",
          statusLabel: "רגישות לרמות pH נמוכות",
          title: "חומצות AHA + ויטמין C טהור",
          desc: "שני הרכיבים בעלי רמת חומציות (pH) נמוכה מאוד. הנחה משותפת מעלה משמעותית את רמת הגירוי והצריבה, בעיקר בעור גברי מגולח או רגיש.",
          protocol: "הנחיית שימוש: הפרד זמנים: ויטמין C בבוקר וחומצה גליקולית בערב, או השתמש בימים לסירוגין."
        },
        "salicylic+vitc": {
          status: "caution",
          statusLabel: "נדרשת הפרדת זמנים",
          title: "חומצה סליצילית (BHA) + ויטמין C",
          desc: "שילוב ישיר עלול לייצר צריבה ואדמומיות סביב הנקבוביות ואיבוד היעילות של ויטמין C בריכוז גבוה.",
          protocol: "הנחיית שימוש: ויטמין C בבוקר, חומצה סליצילית בערב."
        },
        "benzoyl+salicylic": {
          status: "caution",
          statusLabel: "זהירות מייבוש יתר",
          title: "בנזואיל פרוקסיד + חומצה סליצילית (BHA)",
          desc: "שני רכיבים עוצמתיים נגד פצעונים וחיידקי אקנה. שילוב שניהם יחד עלול לקלף את העור, לגרום לאדמומיות ולתחושת מתיחה קיצונית.",
          protocol: "הנחיית שימוש: השתמש בחומצה סליצילית לשטיפה/סרום, ובבנזואיל פרוקסיד אך ורק נקודתית על פצעונים בודדים."
        },
        "benzoyl+glycolic": {
          status: "caution",
          statusLabel: "זהירות מגירוי יתר",
          title: "בנזואיל פרוקסיד + חומצה גליקולית (AHA)",
          desc: "העמסת חומרים פעילים מקלפים. שילוב לא מבוקר עלול להביא לפגיעה במחסום העור ולרגישות גבוהה לשמש.",
          protocol: "הנחיית שימוש: פצל בין ימים שונים והקפד על שימוש בקרם לחות משקם."
        },
        "niacinamide+salicylic": {
          status: "safe",
          statusLabel: "סינרגיה קלינית מושלמת",
          title: "ניאצינמיד + חומצה סליצילית (BHA)",
          desc: "אחד השילובים המומלצים ביותר לעור גברי! החומצה הסליצילית מנקה שומן עמוק מהנקבוביות, והניאצינמיד מווסת את הפרשת הסבום, מרגיע דלקות ומעדן נקבוביות.",
          protocol: "פרוטוקול מומלץ: בטוח לשימוש יומי, בוקר או ערב, לפני קרם לחות."
        },
        "niacinamide+retinol": {
          status: "safe",
          statusLabel: "שילוב מגן ומשקם",
          title: "ניאצינמיד + רטינול",
          desc: "שילוב מנצח: הניאצינמיד מחזק את המחסום השומני של העור ומפחית משמעותית את תופעות הלוואי, היובש והאדמומיות הנלווים לשימוש ברטינול.",
          protocol: "פרוטוקול מומלץ: מריחת ניאצינמיד ראשון ולאחריו רטינול בשגרת הערב."
        },
        "niacinamide+vitc": {
          status: "safe",
          statusLabel: "סינרגיית הבהרה וזוהר",
          title: "ניאצינמיד + ויטמין C",
          desc: "פורמולות מודרניות עובדות יחד בצורה פנטסטית! השילוב מעניק הגנה נוגדת חמצון כפולה, מבהיר כתמים ומשפר את מרקם ואחידות גוון העור.",
          protocol: "פרוטוקול מומלץ: אידיאלי לשגרת הבוקר מתחת למקדם הגנה."
        },
        "niacinamide+tyrosinase": {
          status: "safe",
          statusLabel: "פרוטוקול הבהרה מתקדם",
          title: "ניאצינמיד + מדכאי טירוזינאז",
          desc: "פרוטוקול הבהרה אידיאלי הפועל על שני מנגנונים ביולוגיים נפרדים: עיכוב ייצור המלנין ומניעת מעבר הפיגמנט לתאי העור העליונים.",
          protocol: "פרוטוקול מומלץ: מתאים לבוקר ולערב לטיפול בפיגמנטציה וכתמי שמש."
        },
        "azelaic+salicylic": {
          status: "safe",
          statusLabel: "פרוטוקול אקנה ורוזציאה",
          title: "חומצה אזלאית + חומצה סליצילית (BHA)",
          desc: "פעילות אנטי-בקטריאלית ממוקדת והרגעת אדמומיות בטוחה. אידיאלי לגברים המתמודדים עם פצעונים, גירויים לאחר גילוח או רוזציאה.",
          protocol: "פרוטוקול מומלץ: יעיל מאוד בשגרת ערב עקבית."
        },
        "azelaic+retinol": {
          status: "safe",
          statusLabel: "פרוטוקול מרקם ואחידות",
          title: "חומצה אזלאית + רטינול",
          desc: "שילוב מצוין לחידוש תאים מואץ, טשטוש צלקות פוסט-אקנה והחלקת חספוס בעור הפנים.",
          protocol: "פרוטוקול מומלץ: מומלץ להתחיל בהדרגה בשגרת הלילה."
        },
        "azelaic+vitc": {
          status: "safe",
          statusLabel: "הבהרה ונוגדי חמצון",
          title: "חומצה אזלאית + ויטמין C",
          desc: "שילוב בטוח ואפקטיבי לטשטוש כתמים כהים, עור עמום והגנה סביבתית יומיומית.",
          protocol: "פרוטוקול מומלץ: מעולה לבוקר יחד עם מסנן קרינה."
        },
        "azelaic+niacinamide": {
          status: "safe",
          statusLabel: "פרוטוקול הרגעה ואיזון",
          title: "חומצה אזלאית + ניאצינמיד",
          desc: "שילוב עדין במיוחד המתאים לעור רגיש, מפחית אדמומיות כרונית ומחזק את ההגנה הטבעית.",
          protocol: "פרוטוקול מומלץ: מתאים לשימוש יומיומי פעמיים ביום."
        }
      };

      const molecularData = {
        retinol: { mw: "286.45 g/mol", ph: "5.5-6.5" },
        salicylic: { mw: "138.12 g/mol", ph: "3.0-4.0" },
        glycolic: { mw: "76.05 g/mol", ph: "3.5-4.2" },
        vitc: { mw: "176.12 g/mol", ph: "2.8-3.5" },
        niacinamide: { mw: "122.12 g/mol", ph: "5.0-7.0" },
        azelaic: { mw: "188.22 g/mol", ph: "4.0-5.0" },
        tyrosinase: { mw: "272.25 g/mol", ph: "5.0-6.0" },
        benzoyl: { mw: "242.23 g/mol", ph: "4.5-5.5" },
        hyaluronic: { mw: "1,200 kDa", ph: "5.5-7.0" }
      };

      const sel1 = document.getElementById("ingredient-1");
      const sel2 = document.getElementById("ingredient-2");
      const resetBtn = document.getElementById("checker-reset");
      const chips = document.querySelectorAll(".checker-chip");
      const resultArea = document.getElementById("checker-result-area");
      const checkerBox = document.querySelector(".checker-box");

      if (!sel1 || !sel2 || !resultArea) return;

      function updateChipsState() {
        const val1 = sel1.value;
        const val2 = sel2.value;
        chips.forEach(chip => {
          const v = chip.getAttribute("data-val");
          if (v && (v === val1 || v === val2)) {
            chip.classList.add("is-active");
          } else {
            chip.classList.remove("is-active");
          }
        });
      }

      function evaluateProtocol(a, b) {
        if (!a || !b) {
          const chosen = a || b;
          if (chosen) {
            return {
              type: "incomplete",
              html: `
                <div class="checker-card empty">
                  <div class="mono" style="color:var(--bronze); margin-bottom:4px; font-size:11px;">שלב 2 מתוך 2</div>
                  <h3 style="font-size:18px; font-weight:700; color:var(--ink); margin-bottom:4px;">
                    נבחר רכיב: ${ingredientNames[chosen] || chosen}
                  </h3>
                  <p style="font-size:14.5px; max-width:52ch; margin:0 auto; color:var(--concrete);">
                    בחר כעת רכיב שני מהרשימה או לחץ על אחד הצ'יפים כדי לראות את ניתוח התאימות וההנחיות.
                  </p>
                </div>
              `
            };
          }
          return {
            type: "empty",
            html: `
              <div class="checker-card empty">
                <div class="mono" style="color:var(--bronze); margin-bottom:6px; font-size:11px;">בדיקת תאימות מהירה</div>
                <h3 style="font-size:18px; font-weight:700; color:var(--ink); margin-bottom:6px;">
                  בחר שני רכיבים פעילים לבדיקת תאימות
                </h3>
                <p style="font-size:14.5px; max-width:56ch; margin:0 auto; color:var(--concrete);">
                  סמן שני רכיבים שאתה משלב בבית כדי לקבל מידע ראשוני. ההתאמה בפועל תלויה גם במוצר וברגישות העור.
                </p>
              </div>
            `
          };
        }

        const nameA = ingredientNames[a] || a;
        const nameB = ingredientNames[b] || b;

        let resultData = null;

        if (a === b) {
          resultData = {
            status: "caution",
            statusLabel: "הפרדת פרוטוקול נדרשת (בוקר/ערב)",
            title: `מינון כפול: ${nameA}`,
            desc: `בחרת את אותו רכיב פעיל בשני התכשירים. מריחת תכשירים שונים המכילים את אותו רכיב מעלה את הריכוז ועלולה לגרום לעומס על מחסום העור, קילוף וגירוי מיותר.`,
            protocol: "המלצה מקצועית: השתמש בתכשיר בודד בעל ריכוז מדויק, או בחר רכיב משלים אחר (כמו ניאצינמיד או חומצה היאלורונית)."
          };
        } else if (a === "hyaluronic" || b === "hyaluronic") {
          const otherName = a === "hyaluronic" ? nameB : nameA;
          resultData = {
            status: "safe",
            statusLabel: "סינרגיה קלינית אופטימלית",
            title: `חומצה היאלורונית + ${otherName}`,
            desc: `חומצה היאלורונית וסרמידים הם רכיבי מיום ושיקום ניטרליים המתאימים לשימוש עם כל חומר פעיל. הם מחזירים מים לאפידרמיס, מרגיעים גירויים ומגינים על מחסום העור.`,
            protocol: "הנחיית שימוש: מרח את הסרום על עור לח מעט כדי ללכוד לחות עמוקה, ולאחר מכן הנח את התכשיר הפעיל או קרם הלחות."
          };
        } else {
          const key1 = `${a}+${b}`;
          const key2 = `${b}+${a}`;
          resultData = interactions[key1] || interactions[key2];

          if (!resultData) {
            resultData = {
              status: "unknown",
              statusLabel: "כדאי לבדוק לפני שמשלבים",
              title: `${nameA} + ${nameB}`,
              desc: "אין כרגע מספיק מידע במאגר כדי לקבוע התאמה חד-משמעית בין שני הרכיבים. ההתאמה תלויה גם בריכוז, בפורמולה, בתדירות השימוש וברגישות העור.",
              protocol: "המלצת זהירות: לפני שילוב ישיר באותה שגרת מריחה, מומלץ לוודא את הוראות היצרן או להתייעץ כדי למנוע גירוי מיותר.",
              isUnknown: true
            };
          }
        }

        // Exact clinical gauge labels and configurations
        const statusConfig = {
          danger: {
            statusLabel: "קונטרה-אינדיקציה חריפה: סכנת פגיעה במחסום העור",
            gaugeScore: "ZONE 3 · CRITICAL HAZARD",
            iconHtml: "<span>⚠️</span>",
            enBadge: "CONTRA-INDICATION"
          },
          caution: {
            statusLabel: "הפרדת פרוטוקול נדרשת (בוקר/ערב)",
            gaugeScore: "ZONE 2 · PROTOCOL ISOLATION",
            iconHtml: "<span>⚡</span>",
            enBadge: "SEPARATION REQUIRED"
          },
          safe: {
            statusLabel: "סינרגיה קלינית אופטימלית",
            gaugeScore: "ZONE 1 · CLINICAL TOLERANCE",
            iconHtml: '<span class="clinical-lock-badge">✓</span>',
            enBadge: "OPTIMAL SYNERGY"
          },
          unknown: {
            statusLabel: "כדאי לבדוק לפני שמשלבים",
            gaugeScore: "INSUFFICIENT DATA · VERIFICATION RECOMMENDED",
            iconHtml: "<span>ℹ️</span>",
            enBadge: "VERIFY BEFORE MIXING"
          }
        };

        const config = statusConfig[resultData.status] || statusConfig.unknown;
        resultData.statusLabel = config.statusLabel;

        const waText = resultData.isUnknown
          ? `היי ישראל, בדקתי באתר את השילוב של ${nameA} ו-${nameB}. אשמח לבדוק איתך אם השילוב מתאים לעור שלי.`
          : `היי ישראל, בדקתי באתר את השילוב של ${nameA} ו-${nameB}, ואשמח לייעוץ קצר על שגרת הטיפוח שלי.`;
        const waLink = `https://wa.me/972559958106?text=${encodeURIComponent(waText)}`;

        const ctaTitle = resultData.isUnknown
          ? "רוצה לוודא?"
          : "רוצה לוודא שהשגרה מותאמת בדיוק לסוג העור שלך?";
        const ctaDesc = resultData.isUnknown
          ? "שאל את ישראל בוואטסאפ על התאמת שגרת הטיפוח לעור שלך."
          : "אפשר לשאול את ישראל על התאמת שגרת הטיפוח לעור שלך.";
        const ctaBtnText = resultData.isUnknown
          ? "שאל את ישראל בוואטסאפ ←"
          : "לשאלה על שגרת הטיפוח ←";

        const cardHtml = `
          <div class="checker-card ${resultData.status}">
            <!-- Animated Clinical Status Gauge / Score Bar -->
            <div class="clinical-gauge-wrap">
              <div class="clinical-gauge-header">
                <span>CLINICAL SYNERGY SCORE</span>
                <span>${config.gaugeScore}</span>
              </div>
              <div class="clinical-gauge-track" aria-hidden="true">
                <div class="clinical-gauge-seg seg-safe" title="Safe Zone"></div>
                <div class="clinical-gauge-seg seg-caution" title="Caution Zone"></div>
                <div class="clinical-gauge-seg seg-danger" title="Danger Zone"></div>
              </div>
            </div>

            <!-- Dynamic Status Banner -->
            <div class="checker-status-banner">
              <div class="checker-status-title">
                ${config.iconHtml}
                <span>${resultData.statusLabel}</span>
              </div>
              <span class="mono" style="font-size:10.5px; opacity:0.85;">${config.enBadge}</span>
            </div>

            <h3 class="checker-card-title">${resultData.title}</h3>
            <p class="checker-card-desc">${resultData.desc}</p>

            <div class="checker-protocol-rule">
              <span>⚡</span>
              <span>${resultData.protocol}</span>
            </div>

            <div class="checker-cta-box">
              <div class="checker-cta-text">
                <strong>${ctaTitle}</strong>
                <span>${ctaDesc}</span>
              </div>
              <a href="${waLink}" target="_blank" rel="noopener" class="btn checker-wa-btn">
                ${ctaBtnText}
              </a>
            </div>
          </div>
        `;

        return { type: resultData.status, html: cardHtml };
      }

      let scanTimer = null;

      function render() {
        const val1 = sel1.value;
        const val2 = sel2.value;

        if (scanTimer) {
          clearTimeout(scanTimer);
          scanTimer = null;
        }

        updateChipsState();

        // Toggle visual bond beam connection
        if (checkerBox) {
          if (val1 && val2) {
            checkerBox.classList.add("is-connected");
          } else {
            checkerBox.classList.remove("is-connected");
          }
        }

        if (val1 && val2 && val1 !== val2) {
          const mA = molecularData[val1] || { mw: "210.4 g/mol", ph: "4.5-5.5" };
          const mB = molecularData[val2] || { mw: "168.2 g/mol", ph: "3.5-4.5" };

          resultArea.innerHTML = `
            <div class="checker-card scanning">
              <div class="checker-scan-tag mono">CHECKING INGREDIENT COMPATIBILITY...</div>
              <h3 class="checker-scan-title">בודק התאמה בין הרכיבים...</h3>
              <div class="checker-scan-ticker mono" id="checker-ticker">
                MW: ${mA.mw} ↔ ${mB.mw} · pH: ${mA.ph} vs ${mB.ph}
              </div>
              <div class="checker-scan-track">
                <div class="checker-scan-bar"></div>
              </div>
              <div class="checker-scan-sub mono">EVALUATING EPIDERMAL BARRIER INTEGRITY</div>
            </div>
          `;

          scanTimer = setTimeout(() => {
            const currentVal1 = sel1.value;
            const currentVal2 = sel2.value;
            if (currentVal1 && currentVal2 && currentVal1 !== currentVal2) {
              const res = evaluateProtocol(currentVal1, currentVal2);
              resultArea.innerHTML = res.html;
            }
            scanTimer = null;
          }, 650);
        } else {
          const res = evaluateProtocol(val1, val2);
          resultArea.innerHTML = res.html;
        }
      }

      sel1.addEventListener("change", render);
      sel2.addEventListener("change", render);

      chips.forEach(chip => {
        chip.addEventListener("click", () => {
          const val = chip.getAttribute("data-val");
          if (!sel1.value && !sel2.value) {
            sel1.value = val;
          } else if (sel1.value && !sel2.value) {
            sel2.value = val;
          } else if (!sel1.value && sel2.value) {
            sel1.value = val;
          } else {
            if (sel1.value === val) {
              sel1.value = "";
            } else if (sel2.value === val) {
              sel2.value = "";
            } else {
              sel2.value = val;
            }
          }
          render();
        });
      });

      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          sel1.value = "";
          sel2.value = "";
          render();
        });
      }

      // Initial render
      render();
    })();
