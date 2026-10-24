/* S·I COSMETICS · site chrome shared by every page:
   1) privacy / cookie notice with a consent store (window.SIConsent),
   2) "stop motion" control (WCAG 2.2.2) on pages that animate (<html class="has-motion">).
   The site sets no cookies and loads no analytics today. Any future analytics or marketing tag
   must be added as <script type="text/plain" data-consent="analytics|marketing" data-src="...">
   so it only runs after the visitor opts in. */
(function () {
  'use strict';
  var D = document, root = D.documentElement;
  var KEY = 'si-consent-v1', MKEY = 'si-motion';
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---------- consent store ---------- */
  var state = (function () { try { return JSON.parse(read(KEY) || 'null'); } catch (e) { return null; } })();
  var listeners = [];
  function activate() {
    if (!state) return;
    [].forEach.call(D.querySelectorAll('script[type="text/plain"][data-consent]'), function (s) {
      if (!state[s.getAttribute('data-consent')] || s.getAttribute('data-done')) return;
      var n = D.createElement('script');
      if (s.getAttribute('data-src')) n.src = s.getAttribute('data-src'); else n.text = s.text;
      s.setAttribute('data-done', '1'); s.parentNode.insertBefore(n, s.nextSibling);
    });
  }
  window.SIConsent = {
    get: function () { return state; },
    set: function (v) {
      state = { necessary: true, analytics: !!v.analytics, marketing: !!v.marketing, at: new Date().toISOString() };
      write(KEY, JSON.stringify(state)); activate(); listeners.forEach(function (f) { f(state); });
    },
    onChange: function (f) { listeners.push(f); },
    open: openPanel
  };
  activate();

  /* ---------- styles ---------- */
  var css = D.createElement('style');
  css.textContent = [
    '.si-cc{position:fixed;inset-inline:max(12px,env(safe-area-inset-left,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:250;max-width:560px;margin-inline-start:auto;',
    'background:rgba(23,18,15,.97);color:#EDE6DC;border:1px solid rgba(196,148,106,.45);border-radius:20px;padding:18px 20px;box-shadow:0 30px 80px -20px rgba(0,0,0,.7);',
    'font:400 14.5px/1.6 "IBM Plex Sans Hebrew","Assistant",system-ui,sans-serif;direction:rtl;text-align:right}',
    '.si-cc h2{font:500 16px/1.3 "IBM Plex Sans Hebrew","Assistant",system-ui,sans-serif;margin:0 0 6px;color:#EDE6DC}',
    '.si-cc p{margin:0 0 12px;color:#D2C6B8}',
    '.si-cc a{color:#D9A441;text-decoration:underline;text-underline-offset:3px}',
    '.si-cc .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
    '.si-cc button{font:500 14px "IBM Plex Sans Hebrew","Assistant",system-ui,sans-serif;border-radius:999px;padding:9px 18px;cursor:pointer;border:1px solid #EDE6DC;background:#EDE6DC;color:#0E0B09}',
    '.si-cc button.ghost{background:transparent;color:#EDE6DC;border-color:rgba(237,230,220,.35)}',
    '.si-cc button:focus-visible,.si-motion:focus-visible{outline:2px solid #D9A441;outline-offset:3px}',
    '.si-cc fieldset{border:1px solid rgba(237,230,220,.14);border-radius:14px;padding:10px 14px;margin:0 0 12px;display:grid;gap:8px}',
    '.si-cc legend{padding:0 6px;color:#A99C8C;font-size:13px}',
    '.si-cc label{display:flex;gap:10px;align-items:flex-start;color:#EDE6DC}',
    '.si-cc label small{display:block;color:#A99C8C;font-size:12.5px}',
    '.si-cc input{margin-top:5px;accent-color:#C4946A;width:16px;height:16px}',
    '.si-motion{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:90;display:inline-flex;align-items:center;gap:8px;',
    'background:rgba(14,11,9,.82);border:1px solid rgba(237,230,220,.28);color:#EDE6DC;padding:9px 14px;border-radius:999px;font:500 13px "IBM Plex Sans Hebrew","Assistant",system-ui,sans-serif;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}',
    '.si-motion svg{width:14px;height:14px}',
    '.si-cc[hidden],.si-motion[hidden]{display:none!important}',
    'body.si-cc-open .si-motion{bottom:calc(20px + env(safe-area-inset-bottom,0px))}'
  ].join('');
  D.head.appendChild(css);

  /* ---------- notice / settings panel ---------- */
  var box = null;
  function build(settings) {
    if (box) box.remove();
    box = D.createElement('section');
    box.className = 'si-cc'; box.setAttribute('role', 'region'); box.setAttribute('aria-label', 'פרטיות ועוגיות');
    var cur = state || { analytics: false, marketing: false };
    box.innerHTML = settings
      ? '<h2>הגדרות פרטיות</h2>' +
        '<p>האתר לא משתמש היום בעוגיות פרסום, מעקב או סטטיסטיקה. כאן אפשר לקבוע מראש מה מותר אם יתווספו כלים כאלה.</p>' +
        '<fieldset><legend>קטגוריות</legend>' +
        '<label><input type="checkbox" checked disabled> <span>הכרחיות<small>שמירת ההעדפות שלך בדפדפן (הבחירה כאן, עצירת תנועה). תמיד פעילות.</small></span></label>' +
        '<label><input type="checkbox" id="si-cc-an"' + (cur.analytics ? ' checked' : '') + '> <span>סטטיסטיקה<small>מדידת שימוש אנונימית, אם תופעל בעתיד.</small></span></label>' +
        '<label><input type="checkbox" id="si-cc-mk"' + (cur.marketing ? ' checked' : '') + '> <span>שיווק<small>כלי פרסום ברשתות, אם יופעלו בעתיד.</small></span></label>' +
        '</fieldset>' +
        '<div class="row"><button type="button" data-a="save">שמירה</button><button type="button" class="ghost" data-a="none">רק הכרחיות</button><a href="/privacy/">מדיניות פרטיות</a></div>'
      : '<h2>פרטיות באתר</h2>' +
        '<p>האתר לא משתמש בעוגיות פרסום, מעקב או סטטיסטיקה, והכלים בו רצים בדפדפן שלך בלבד. נשמרות רק העדפות טכניות, למשל אם עצרת את התנועה. <a href="/privacy/">מדיניות פרטיות</a></p>' +
        '<div class="row"><button type="button" data-a="ok">הבנתי</button><button type="button" class="ghost" data-a="settings">הגדרות</button></div>';
    D.body.appendChild(box); D.body.classList.add('si-cc-open');
    box.addEventListener('click', function (e) {
      var a = e.target.getAttribute && e.target.getAttribute('data-a'); if (!a) return;
      if (a === 'settings') { build(true); var f = box.querySelector('input:not([disabled])'); if (f) f.focus(); return; }
      if (a === 'save') window.SIConsent.set({ analytics: box.querySelector('#si-cc-an').checked, marketing: box.querySelector('#si-cc-mk').checked });
      else window.SIConsent.set({ analytics: false, marketing: false });
      close();
    });
    box.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state) close(); });
  }
  function close() { if (box) { box.remove(); box = null; } D.body.classList.remove('si-cc-open'); }
  function openPanel() { build(true); var f = box.querySelector('input:not([disabled]),button'); if (f) f.focus(); }
  [].forEach.call(D.querySelectorAll('[data-open-consent]'), function (b) { b.addEventListener('click', function (e) { e.preventDefault(); openPanel(); }); });
  function boot() { if (!state) build(false); }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot); else boot();

  /* ---------- stop motion (pages with continuous animation) ---------- */
  if (root.classList.contains('has-motion')) {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches, saved = read(MKEY);
    var paused = saved ? saved === 'off' : reduce;
    var btn = D.createElement('button'); btn.type = 'button'; btn.className = 'si-motion';
    var ico = { pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2" width="3.5" height="12" rx="1" fill="currentColor"/><rect x="9.5" y="2" width="3.5" height="12" rx="1" fill="currentColor"/></svg>',
                play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>' };
    function render() {
      root.classList.toggle('x-paused', paused);
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      btn.innerHTML = paused ? ico.play + '<span>הפעלת תנועה</span>' : ico.pause + '<span>עצירת תנועה</span>';
    }
    btn.addEventListener('click', function () { paused = !paused; write(MKEY, paused ? 'off' : 'on'); render(); });
    render();
    function addBtn() { D.body.appendChild(btn); }
    if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', addBtn); else addBtn();
  }
})();
