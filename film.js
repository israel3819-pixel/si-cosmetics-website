/* S·I film (v4): chapter rail, pinned video reel, pinned story lines */
(function () {
  'use strict';
  var D = document, W = window;
  var reduce = W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) D.documentElement.classList.add('x-static');
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  function prog(el) { var r = el.getBoundingClientRect(), span = r.height - W.innerHeight; return span > 0 ? clamp(-r.top / span, 0, 1) : 0; }
  var rail = [].slice.call(D.querySelectorAll('.x-rail a'));
  var railT = rail.map(function (a) { return D.querySelector(a.getAttribute('href')); });
  rail.forEach(function (a) { a.addEventListener('click', function (e) { var t = D.querySelector(a.getAttribute('href')); if (!t) return; e.preventDefault(); W.scrollTo({ top: W.scrollY + t.getBoundingClientRect().top - (t.id === 'top' ? 0 : 60), behavior: reduce ? 'auto' : 'smooth' }); }); });
  var reel = D.querySelector('.x-reel'), track = reel && reel.querySelector('.x-reel-track'), bar = reel && reel.querySelector('.x-reel-bar i');
  var scene = D.querySelector('.x-story-scene'), lines = scene ? [].slice.call(scene.querySelectorAll('.x-line')) : [], cur = scene && scene.querySelector('.x-story-count .cur');
  var lastIdx = -2;
  function tick() {
    var mid = W.innerHeight * .4, on = -1;
    railT.forEach(function (t, i) { if (t && t.getBoundingClientRect().top < mid) on = i; });
    rail.forEach(function (a, i) { a.classList.toggle('on', i === on); });
    if (!reduce && reel && track) {
      var p = prog(reel), max = Math.max(0, track.scrollWidth - W.innerWidth);
      track.style.transform = 'translate3d(' + (p * max).toFixed(1) + 'px,0,0)';
      if (bar) bar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
    }
    if (!reduce && scene && lines.length) {
      var q = prog(scene), idx = Math.min(lines.length - 1, Math.floor(q * lines.length * .999));
      if (idx !== lastIdx) {
        lastIdx = idx;
        lines.forEach(function (l, i) { l.classList.toggle('on', i === idx); l.classList.toggle('past', i < idx); });
        if (cur) cur.textContent = (idx + 1 < 10 ? '0' : '') + (idx + 1);
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
