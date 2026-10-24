/* S·I COSMETICS · V2 world: portal intro, one particle world driven by scroll anchors, bloom, cursor field, text reveals. */
(function () {
  'use strict';
  var D = document, W = window, root = D.documentElement, body = D.body;
  var reduce = W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrow = function () { return W.innerWidth < 760 || W.innerWidth / W.innerHeight < .8; };
  var lowEnd = (navigator.hardwareConcurrency || 8) <= 4 || !!(navigator.connection && navigator.connection.saveData);
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var ease = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var R = Math.random;
  var GL = (function () {
    try { var c = D.createElement('canvas'); return !!(W.THREE && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }
    catch (e) { return false; }
  })();
  if (!GL) root.classList.add('x-nogl');

  /* ---------------- header, menu, progress, anchors ---------------- */
  var top = D.getElementById('x-top'), prog = D.querySelector('.x-progress');
  var menuBtn = D.querySelector('.x-menu');
  menuBtn && menuBtn.addEventListener('click', function () {
    var open = top.classList.toggle('is-open'); menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  [].forEach.call(D.querySelectorAll('a[href^="#"]'), function (a) {
    a.addEventListener('click', function (e) {
      var t = D.querySelector(a.getAttribute('href')); if (!t) return;
      e.preventDefault(); top.classList.remove('is-open'); menuBtn && menuBtn.setAttribute('aria-expanded', 'false');
      var y = W.scrollY + t.getBoundingClientRect().top - (t.id === 'top' ? 0 : 70);
      W.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    });
  });
  var navLinks = [].slice.call(D.querySelectorAll('.x-nav a'));
  var navTargets = navLinks.map(function (a) { return D.querySelector(a.getAttribute('href')); });
  function onScrollUI() {
    var max = D.documentElement.scrollHeight - W.innerHeight;
    if (prog) prog.style.transform = 'scaleX(' + (max > 0 ? W.scrollY / max : 0) + ')';
    top.classList.toggle('is-solid', W.scrollY > 40);
    var cur = -1, mid = W.innerHeight * .35;
    navTargets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top < mid) cur = i; });
    navLinks.forEach(function (a, i) { a.classList.toggle('is-current', i === cur); });
  }
  W.addEventListener('scroll', onScrollUI, { passive: true }); onScrollUI();

  /* ---------------- text: split words + reveal on view ---------------- */
  [].forEach.call(D.querySelectorAll('.x-split'), function (el) {
    if (el.children.length) return;
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach(function (w, i) {
      var o = D.createElement('span'); o.className = 'w';
      var s = D.createElement('span'); s.textContent = w; s.style.transitionDelay = (i * 110) + 'ms';
      o.appendChild(s); el.appendChild(o);
      if (i < words.length - 1) el.appendChild(D.createTextNode(' '));
    });
  });
  var revealEls = [].slice.call(D.querySelectorAll('.x-split, .x-rise'));
  if (reduce || !('IntersectionObserver' in W)) revealEls.forEach(function (el) { el.classList.add('in'); });
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- magnetic buttons ---------------- */
  if (!reduce && W.matchMedia('(hover: hover)').matches) {
    [].forEach.call(D.querySelectorAll('.mag'), function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .22).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .35).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------------- videos play on hover ---------------- */
  [].forEach.call(D.querySelectorAll('.x-vid'), function (card) {
    var v = card.querySelector('video'); if (!v) return;
    card.addEventListener('mouseenter', function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); });
    card.addEventListener('mouseleave', function () { v.pause(); });
  });

  /* ---------------- marquee driven by scroll velocity ---------------- */
  var tracks = [].slice.call(D.querySelectorAll('.x-track')), mOff = 0, lastY = W.scrollY, vel = 0;
  function marquee(dt) {
    var y = W.scrollY; vel += ((y - lastY) / Math.max(dt, .001) - vel) * .1; lastY = y;
    mOff += (40 + Math.min(900, Math.abs(vel)) * .6) * dt;
    tracks.forEach(function (t) {
      var half = t.scrollWidth / 2; if (!half) return;
      var x = (mOff % half) * (+t.dataset.dir || 1);
      t.style.transform = 'translate3d(' + (t.dataset.dir === '-1' ? x - half : -x) + 'px,0,0) skewX(' + clamp(-vel * .004, -8, 8).toFixed(2) + 'deg)';
    });
  }

  /* ---------------- intro (sand portal) ---------------- */
  var intro = D.getElementById('x-intro'), introState = { running: false, k: 1 };
  function ready() { body.classList.add('ready'); }
  function runIntro(onOpenStart) {
    var seen = false; try { seen = sessionStorage.getItem('si-intro') === '1'; sessionStorage.setItem('si-intro', '1'); } catch (e) {}
    if (!intro || reduce || seen) { if (intro) intro.remove(); introState.k = 1; ready(); return; }
    root.classList.add('x-intro-on'); introState.running = true; introState.k = 0;
    var lock = intro.querySelector('.x-lockup'), curtain = intro.querySelector('.x-curtain'), cpath = curtain.querySelector('path');
    var timers = [], opened = false, t0 = 0;
    var at = function (ms, fn) { timers.push(setTimeout(fn, ms)); };
    at(60, function () { intro.classList.add('s-draw'); });
    at(650, function () { intro.classList.add('s-word'); });
    at(1250, open);
    function open() {
      if (opened) return; opened = true; timers.forEach(clearTimeout);
      intro.classList.add('s-draw', 's-word');
      var r = lock.getBoundingClientRect(), k = r.width / 300;
      var cx = r.left + 150 * k, sy0 = r.top + 85 * k, by0 = r.top + 235 * k, r0 = 75 * k, cy = (sy0 + by0) / 2;
      var vw = W.innerWidth, vh = W.innerHeight, sMax = Math.hypot(vw, vh) / r0 * 1.5;
      curtain.setAttribute('viewBox', '0 0 ' + vw + ' ' + vh);
      function draw(s) {
        var Rr = r0 * s, SY = cy + (sy0 - cy) * s, BY = cy + (by0 - cy) * s;
        cpath.setAttribute('d', 'M-20 -20H' + (vw + 20) + 'V' + (vh + 20) + 'H-20Z M' + (cx - Rr) + ' ' + BY + 'V' + SY + 'A' + Rr + ' ' + Rr + ' 0 0 1 ' + (cx + Rr) + ' ' + SY + 'V' + BY + 'Z');
      }
      draw(1); intro.classList.add('s-open');
      t0 = performance.now();
      var dur = 1500, flight = 3000, shown = false;
      (function step(now) {
        var u = clamp((now - t0) / dur, 0, 1);
        draw(1 + (sMax - 1) * Math.pow(u, 2.2));
        introState.k = clamp((now - t0) / flight, 0, 1);
        if (!shown && introState.k > .72) { shown = true; ready(); }
        if (introState.k < 1) requestAnimationFrame(step); else finish();
      })(t0);
    }
    function finish() {
      introState.running = false; introState.k = 1;
      root.classList.remove('x-intro-on'); intro.remove(); ready();
      ['wheel', 'touchmove', 'keydown'].forEach(function (ev) { W.removeEventListener(ev, skip); });
    }
    function skip() {
      if (!opened) open();
      else { t0 -= 99999; }
    }
    intro.querySelector('.x-skip').addEventListener('click', skip);
    ['wheel', 'touchmove', 'keydown'].forEach(function (ev) { W.addEventListener(ev, skip, { passive: true }); });
  }

  /* ---------------- the particle world ---------------- */
  var world = null;
  if (GL) { try { world = buildWorld(); } catch (e) { console.warn('world', e); root.classList.add('x-nogl'); world = null; } }
  runIntro();
  var last = performance.now();
  (function loop(now) {
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!reduce) marquee(dt);
    if (world) world.frame(dt);
    requestAnimationFrame(loop);
  })(last);

  function archPt(t, a, sy, by) {
    var leg = sy - by, arc = Math.PI * a, L = 2 * leg + arc, d = t * L;
    if (d < leg) return [-a, by + d];
    d -= leg; if (d < arc) { var th = Math.PI - d / a; return [Math.cos(th) * a, sy + Math.sin(th) * a]; }
    d -= arc; return [a, sy + leg - d];
  }

  function buildWorld() {
    var canvas = D.getElementById('x-stage');
    var rd = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    rd.setPixelRatio(Math.min(W.devicePixelRatio || 1, narrow() ? 1.6 : 2));
    rd.setClearColor(0x15110E, 1); rd.autoClear = false;
    var bgScene = new THREE.Scene(), bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    var BG = { uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uTint: { value: new THREE.Color('#8A6446') },
      uTint2: { value: new THREE.Color('#566472') }, uMouse2: { value: new THREE.Vector2(.5, .5) } };
    bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: BG, depthWrite: false, depthTest: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
      fragmentShader: [
        'uniform float uTime; uniform vec2 uRes,uMouse2; uniform vec3 uTint,uTint2; varying vec2 vUv;',
        'float blob(vec2 p, vec2 c, float r){ vec2 d=(p-c)*vec2(uRes.x/uRes.y,1.); return exp(-dot(d,d)/(r*r)); }',
        'float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }',
        'void main(){',
        '  vec2 p=vUv; float t=uTime*.04;',
        '  vec3 c=vec3(.072,.06,.052);',
        '  c += uTint*.34*blob(p, vec2(.26+.08*sin(t*1.3), .70+.07*cos(t)), .62);',
        '  c += vec3(.80,.72,.62)*.08*blob(p, vec2(.80+.06*cos(t*.9), .86+.05*sin(t*1.1)), .5);',
        '  c += uTint2*.24*blob(p, vec2(.72+.1*sin(t*.7), .20+.06*cos(t*1.2)), .66);',
        '  c += vec3(.92,.70,.42)*.07*blob(p, uMouse2, .32);',
        '  c *= 1.-.4*pow(length(p-.5)*1.25,2.);',
        '  c += (hash(p*uRes+fract(t))-.5)*.012;',
        '  gl_FragColor=vec4(c,1.);',
        '}'].join('\n')
    })));
    var TINT = [ '#6E5440', '#8A6446', '#94503A', '#6F7C88', '#A0703F', '#8A6446', '#7A604B', '#8A6446' ].map(function (h) { return new THREE.Color(h); });
    var scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(42, 1, .1, 120);
    var N = narrow() ? 5200 : (lowEnd ? 6000 : 9500);
    var A = {}; ['p0', 'p1', 'p2', 'p3', 'p5', 'p7'].forEach(function (k) { A[k] = new Float32Array(N * 3); });
    var pcol = new Float32Array(N * 3), spray = new Float32Array(N * 4), rnd = new Float32Array(N), beam = new Float32Array(N), arch = new Float32Array(N), scl = new Float32Array(N);
    var set = function (a, i, x, y, z) { a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z; };
    var sph = function () { var u = R() * 2 - 1, t = R() * Math.PI * 2, r = Math.sqrt(1 - u * u); return [r * Math.cos(t), u, r * Math.sin(t)]; };
    var i, q;
    for (i = 0; i < N; i++) { q = sph(); var rr = 6 + R() * 14; set(A.p0, i, q[0] * rr, q[1] * rr * .7, q[2] * rr - 4); }
    for (i = 0; i < N; i++) {
      if (i < N * .66) { q = sph(); var r1 = 1.45 + (R() - .5) * .12; set(A.p1, i, q[0] * r1, q[1] * r1 + .15, q[2] * r1); }
      else { arch[i] = 1; q = archPt(R(), 2.6, .9, -3.1); set(A.p1, i, q[0] + (R() - .5) * .06, q[1] + (R() - .5) * .06, (R() - .5) * .08); }
    }
    var nBeam = Math.floor(N * .1), nGrid = N - nBeam, GW = 7.6, GD = 4.4, cols = Math.round(Math.sqrt(nGrid * GW / GD)), rows = Math.ceil(nGrid / cols);
    for (i = 0; i < nGrid; i++) {
      var cI = i % cols, rI = Math.floor(i / cols), x = -GW / 2 + cI / (cols - 1) * GW, z = -GD / 2 + rI / Math.max(1, rows - 1) * GD;
      set(A.p2, i, x, -.6 + .22 * Math.sin(x * .7) * Math.cos(z * .9), z);
    }
    for (i = nGrid; i < N; i++) { beam[i] = 1; set(A.p2, i, (R() - .5) * .05, -.6 + Math.pow(R(), 1.7) * 3.8, (R() - .5) * GD); }
    for (i = 0; i < N; i++) {
      var th = Math.acos(1 - 2 * R()), f = R() * Math.PI * 2, kk = i < N * .86 ? 1 : Math.cbrt(R()) * .85, rd2 = Math.sin(th) * Math.sin(th / 2) * 2.3 * kk;
      set(A.p3, i, rd2 * Math.cos(f), Math.cos(th) * 2.5 * kk + .1, rd2 * Math.sin(f));
    }
    for (i = 0; i < N; i++) {
      if (i < N * .8) { q = archPt(R(), 2.9, .5, -3.6); set(A.p7, i, q[0] + (R() - .5) * .08, q[1] + (R() - .5) * .08, (R() - .5) * .12); }
      else { q = archPt(R(), 2.45, .5, -3.6); set(A.p7, i, q[0] + (R() - .5) * .04, q[1] + (R() - .5) * .04, -1.2 + (R() - .5) * .1); }
    }
    A.p5.set(A.p1);
    for (i = 0; i < N; i++) {
      spray[i * 4] = R(); spray[i * 4 + 1] = R() * Math.PI * 2; spray[i * 4 + 2] = Math.sqrt(R()); spray[i * 4 + 3] = R();
      rnd[i] = R(); scl[i] = R() < .03 ? 2.4 : .55 + R() * .8;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(A.p1, 3));
    var p5attr;
    ['p0', 'p1', 'p2', 'p3', 'p5', 'p7'].forEach(function (k) { var at = new THREE.BufferAttribute(A[k], 3); if (k === 'p5') p5attr = at; g.setAttribute(k, at); });
    g.setAttribute('aSpray', new THREE.BufferAttribute(spray, 4));
    g.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
    g.setAttribute('aBeam', new THREE.BufferAttribute(beam, 1));
    g.setAttribute('aArch', new THREE.BufferAttribute(arch, 1));
    for (i = 0; i < N; i++) { pcol[i * 3] = .89; pcol[i * 3 + 1] = .79; pcol[i * 3 + 2] = .65; }
    var colAttr = new THREE.BufferAttribute(pcol, 3); g.setAttribute('aCol', colAttr);
    g.setAttribute('aScale', new THREE.BufferAttribute(scl, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);
    var C = function (h) { return new THREE.Color(h); };
    var U = {
      uFrom: { value: 0 }, uTo: { value: 1 }, uT: { value: 0 }, uTime: { value: 0 }, uScanX: { value: 0 },
      uSize: { value: narrow() ? 2.3 : 2.6 }, uPR: { value: rd.getPixelRatio() },
      uMouse: { value: new THREE.Vector2(99, 99) }, uRepel: { value: 0 },
      uC: { value: [C('#7A5E4A'), C('#E4C9A6'), C('#CFC2B2'), C('#D8D1C6'), C('#C98A55'), C('#EDE6DC'), C('#8E7460'), C('#D8AE80')] }
    };
    var mat = new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: [
        'uniform float uFrom,uTo,uT,uTime,uScanX,uSize,uPR,uRepel; uniform vec2 uMouse; uniform vec3 uC[8];',
        'attribute vec3 p0,p1,p2,p3,p5,p7; attribute vec4 aSpray; attribute float aRand,aBeam,aScale,aArch; attribute vec3 aCol;',
        'varying vec3 vCol; varying float vA;',
        'mat2 r2(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }',
        'float wt(float i,float t){ return (abs(uFrom-i)<.5 ? 1.-t : 0.) + (abs(uTo-i)<.5 ? t : 0.); }',
        'void main(){',
        '  float t = smoothstep(0.,1.,clamp(uT*1.5 - aRand*.5, 0., 1.));',
        '  float w0=wt(0.,t), w1=wt(1.,t), w2=wt(2.,t), w3=wt(3.,t), w4=wt(4.,t), w5=wt(5.,t), w6=wt(6.,t), w7=wt(7.,t);',
        '  vec3 a0 = p0 + .35*vec3(sin(uTime*.3+aRand*40.), cos(uTime*.25+aRand*30.), 0.);',
        '  vec3 a6 = p0*vec3(1.15,1.2,1.) + vec3(0.,0.,-3.); a6.xz = r2(uTime*.025)*a6.xz; a6.y += .4*sin(uTime*.2+aRand*12.);',
        '  vec3 a1 = p1 + vec3(.012*sin(uTime*1.1+aRand*40.), .012*cos(uTime*.9+aRand*30.), .05*sin(uTime*.7+aRand*20.));',
        '  vec3 a2 = p2; if(aBeam>.5) a2.x += uScanX;',
        '  vec3 a3 = p3; a3.xz = r2(uTime*.16)*a3.xz; a3.y += .06*sin(uTime*.8);',
        '  float s = fract(aSpray.x + uTime*.11);',
        '  vec3 noz = vec3(3.0,1.7,0.), dir = normalize(vec3(-1.,-.42,.12));',
        '  vec3 up = normalize(cross(dir, vec3(0.,0.,1.))), sd = cross(dir, up);',
        '  vec3 a4 = noz + dir*s*6.8 + (up*cos(aSpray.y) + sd*sin(aSpray.y))*(.06 + s*1.7)*aSpray.z;',
        '  a4.y -= s*s*.9; a4 += .18*s*vec3(sin(uTime*.9+aSpray.w*20.), cos(uTime*1.1+aSpray.w*13.), sin(uTime*.7+aSpray.w*9.));',
        '  vec3 a5 = p5 + .02*vec3(sin(uTime+aRand*50.), cos(uTime*1.2+aRand*30.), 0.);',
        '  vec3 a7 = p7 + .03*vec3(sin(uTime*1.1+aRand*40.), cos(uTime*.9+aRand*30.), 0.);',
        '  vec3 pos = a0*w0 + a1*w1 + a2*w2 + a3*w3 + a4*w4 + a5*w5 + a6*w6 + a7*w7;',
        '  vec3 c = uC[0]*w0 + mix(aCol, vec3(.86,.6,.38), aArch)*w1 + uC[2]*w2 + uC[3]*w3 + uC[4]*w4 + uC[5]*w5 + uC[6]*w6 + uC[7]*w7;',
        '  float scan = aBeam>.5 ? 1. : exp(-pow((p2.x-uScanX)*2.4, 2.));',
        '  c = mix(c, vec3(1.,.42,.24), scan*w2*.95);',
        '  vec2 dm = pos.xy - uMouse; float fm = exp(-dot(dm,dm)*1.3)*uRepel;',
        '  pos.xy += normalize(dm + vec2(1e-4))*fm*.85; pos.z += fm*.6; c += fm*vec3(.35,.22,.1);',
        '  float a = .5 + .5*aRand;',
        '  a *= mix(1., .55 + .45*scan, w2);',
        '  a *= mix(1., (1.-s)*smoothstep(0.,.08,s), w4);',
        '  a *= mix(1., .4, w0); a *= mix(1., .32, w6);',
        '  vec4 mv = modelViewMatrix*vec4(pos,1.);',
        '  gl_Position = projectionMatrix*mv;',
        '  gl_PointSize = 1.9*uSize*aScale*(1.+scan*w2*.9)*(1.+w4*s*1.3)*(1.+fm*.8)*uPR*(10./-mv.z);',
        '  vCol = c; vA = a;',
        '}'].join('\n'),
      fragmentShader: 'varying vec3 vCol; varying float vA; void main(){ float d=length(gl_PointCoord-.5); float core=smoothstep(.26,.0,d); float halo=pow(smoothstep(.5,.0,d),2.2)*.55; gl_FragColor=vec4(vCol*1.45,(core+halo)*vA); }'
    });
    scene.add(new THREE.Points(g, mat));

    // brand-arch tunnel the camera flies through during the opening
    var arches = [];
    for (var k = 0; k < 12; k++) {
      var pts = []; for (var j = 0; j <= 160; j++) { q = archPt(j / 160, 2.6, .9, -3.1); pts.push(new THREE.Vector3(q[0], q[1], 0)); }
      var m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, .016, 6, false),
        new THREE.MeshBasicMaterial({ color: 0xC4946A, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.position.z = 13 + k * 2.8; scene.add(m); arches.push(m);
    }

    // the real lockup, as particles, for the closing chapter
    function buildLogo() {
      var S = 3, cw = 300 * S, ch = 260 * S, c = D.createElement('canvas'); c.width = cw; c.height = ch;
      var g2 = c.getContext('2d'); g2.scale(S, S); g2.strokeStyle = '#fff'; g2.fillStyle = '#fff'; g2.lineWidth = 3;
      g2.save(); g2.beginPath(); g2.rect(0, 0, 300, 137); g2.rect(0, 167, 300, 93); g2.clip();
      g2.beginPath(); g2.moveTo(75, 235); g2.lineTo(75, 85); g2.arc(150, 85, 75, Math.PI, 0); g2.lineTo(225, 235); g2.stroke(); g2.restore();
      g2.font = '500 21px Archivo, Helvetica, Arial, sans-serif';
      var word = 'S·I COSMETICS', ls = 6.3, tw = 0, ch2;
      for (ch2 of word) tw += g2.measureText(ch2).width + ls; tw -= ls;
      var x0 = 150 - tw / 2; for (ch2 of word) { g2.fillText(ch2, x0, 159); x0 += g2.measureText(ch2).width + ls; }
      var d = g2.getImageData(0, 0, cw, ch).data, P = [];
      for (var y = 0; y < ch; y++) for (var x = 0; x < cw; x++) if (d[(y * cw + x) * 4 + 3] > 140) P.push(x, y);
      if (!P.length) return;
      var n = P.length / 2;
      for (var i2 = 0; i2 < N; i2++) { var t2 = Math.floor(R() * n) * 2; set(A.p5, i2, (P[t2] - cw / 2) / cw * 7.2 + (R() - .5) * .02, -(P[t2 + 1] - ch / 2) / cw * 7.2 + .9, (R() - .5) * .12); }
      p5attr.needsUpdate = true;
    }
    (D.fonts && D.fonts.load ? D.fonts.load('500 21px Archivo') : Promise.resolve()).then(buildLogo, buildLogo);

    // bloom on larger screens
    var composer = null;
    if (!narrow() && !lowEnd && THREE.EffectComposer && THREE.UnrealBloomPass && THREE.RenderPass) {
      try {
        composer = new THREE.EffectComposer(rd);
        composer.addPass(new THREE.RenderPass(bgScene, bgCam));
        var rp2 = new THREE.RenderPass(scene, cam); rp2.clear = false; composer.addPass(rp2);
        composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(W.innerWidth, W.innerHeight), .5, .45, .5));
      } catch (e) { composer = null; }
    }

    // camera per shape [camX,camY,camZ, lookX,lookY,lookZ]; objects sit left, copy right (RTL)
    var K = {
      0: [0, .2, 48, 0, 0, 0], 1: [0, .3, 10.5, 1.6, 0, 0], 2: [0, 4.2, 8.2, 1.4, -.5, 0], 3: [0, .4, 8.6, 1.9, .2, 0],
      4: [0, .6, 9.4, 1.5, .1, 0], 5: [0, .4, 17, 0, -2.2, 0], 6: [0, 0, 13, 0, 0, 0], 7: [0, .2, 12.5, 1.3, -.2, 0]
    };
    var KM = {
      0: [0, .2, 48, 0, 0, 0], 1: [0, .3, 13, 0, -1.9, 0], 2: [0, 4.2, 15.5, 0, -2.8, 0], 3: [0, .4, 14, 0, -2.6, 0],
      4: [0, .6, 12, 0, -1.8, 0], 5: [0, .4, 22, 0, -4.4, 0], 6: [0, 0, 15, 0, 0, 0], 7: [0, .2, 20, 0, -3.8, 0]
    };
    var pEl = D.querySelector('.x-portrait'), pImg = pEl && pEl.querySelector('img'), tmpCam = new THREE.PerspectiveCamera(42, 1, .1, 120);
    var nPortrait = Math.floor(N * .72);
    function toWorld(sx, sy, kf) {
      var w = W.innerWidth, h = W.innerHeight;
      tmpCam.aspect = w / h; tmpCam.updateProjectionMatrix();
      tmpCam.position.set(kf[0], kf[1], kf[2]); tmpCam.lookAt(kf[3], kf[4], kf[5]); tmpCam.updateMatrixWorld();
      var v = new THREE.Vector3(sx / w * 2 - 1, -(sy / h) * 2 + 1, .5).unproject(tmpCam).sub(tmpCam.position).normalize();
      var t = -tmpCam.position.z / v.z; return [tmpCam.position.x + v.x * t, tmpCam.position.y + v.y * t];
    }
    function buildPortrait() {
      if (!pEl || !pImg || !pImg.naturalWidth) return;
      var r = pEl.getBoundingClientRect(), top0 = r.top + W.scrollY;
      var kf = (narrow() ? KM : K)[1];
      var tl = toWorld(r.left, top0, kf), br = toWorld(r.right, top0 + r.height, kf);
      var L = tl[0], T = tl[1], Rr = br[0], B = br[1], ww = Rr - L, hh = T - B;
      var cw = 180, ch = Math.round(cw * r.height / r.width), c = D.createElement('canvas'); c.width = cw; c.height = ch;
      var g2 = c.getContext('2d');
      var iw = pImg.naturalWidth, ih = pImg.naturalHeight, sc = Math.max(cw / iw, ch / ih), dw = iw * sc, dh = ih * sc;
      g2.drawImage(pImg, (cw - dw) / 2, (ch - dh) * .2, dw, dh);
      var data; try { data = g2.getImageData(0, 0, cw, ch).data; } catch (e) { return; }
      var rad = cw / 2, k2 = 0, tries = 0;
      while (k2 < nPortrait && tries < nPortrait * 40) {
        tries++;
        var x = Math.random() * cw, y = Math.random() * ch, xi = x | 0, yi = y | 0;
        if (y < rad && Math.hypot(x - rad, y - rad) > rad) continue;            // outside the arch top
        var o = (yi * cw + xi) * 4, lum = (data[o] * .3 + data[o + 1] * .59 + data[o + 2] * .11) / 255;
        if (Math.random() > .18 + lum * .95) continue;                         // denser where the photo is bright
        set(A.p1, k2, L + x / cw * ww, T - y / ch * hh, (lum - .5) * .35);
        var gr = data[o] / 255, gg = data[o + 1] / 255, gb = data[o + 2] / 255;
        pcol[k2 * 3] = Math.min(1, gr * .78 + .22 * .95); pcol[k2 * 3 + 1] = Math.min(1, gg * .78 + .22 * .72); pcol[k2 * 3 + 2] = Math.min(1, gb * .78 + .22 * .45);
        arch[k2] = 0; k2++;
      }
      var a = ww / 2 * 1.12, cx = L + ww / 2, sy = T - ww / 2, by = B - hh * .02;
      for (var i3 = k2; i3 < N; i3++) {
        arch[i3] = 1; var q3 = archPt(Math.random(), a, sy, by);
        set(A.p1, i3, cx + q3[0] + (Math.random() - .5) * .05, q3[1] + (Math.random() - .5) * .05, (Math.random() - .5) * .06);
      }
      g.attributes.p1.needsUpdate = true; colAttr.needsUpdate = true; g.attributes.aArch.needsUpdate = true;
    }
    if (pImg) { if (pImg.complete && pImg.naturalWidth) setTimeout(buildPortrait, 50); else pImg.addEventListener('load', buildPortrait); }
    var rpT = 0; W.addEventListener('resize', function () { clearTimeout(rpT); rpT = setTimeout(buildPortrait, 250); });
    // the photo shows once the dust has gathered, and dissolves back into dust as you scroll on
    function portraitFade() {
      if (!pEl) return;
      var on = body.classList.contains('ready') && !(introState.running || introState.k < 1);
      var o = on ? clamp(1 - W.scrollY / (W.innerHeight * .32), 0, 1) * clamp(1 - S * 3, 0, 1) : 0;
      pEl.style.opacity = o.toFixed(3);
    }

    var SH = { hero: 1, laser: 2, drop: 3, tan: 4, logo: 5, ambient: 6, arch: 7 };
    var anchors = [].slice.call(D.querySelectorAll('[data-shape]')).map(function (el) { return { el: el, s: SH[el.dataset.shape] }; });

    function size() {
      var w = W.innerWidth, h = W.innerHeight;
      rd.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
      if (composer) composer.setSize(w, h);
      BG.uRes.value.set(w, h);
    }
    size(); W.addEventListener('resize', size);

    var ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3(), ndc = new THREE.Vector2(9, 9);
    var m2 = new THREE.Vector2(.5, .5), lastMove = -1e9, mTarget = new THREE.Vector2(99, 99);
    W.addEventListener('pointermove', function (e) { m2.set(e.clientX / W.innerWidth, 1 - e.clientY / W.innerHeight); ndc.set(e.clientX / W.innerWidth * 2 - 1, -(e.clientY / W.innerHeight) * 2 + 1); lastMove = performance.now(); }, { passive: true });

    var time = 0, look = new THREE.Vector3(), S = 0, Svel = 0, MAXV = reduce ? 6 : .38;
    // where the scroll says the story is, in anchor units (2.0 = fully on anchor 2)
    function targetS() {
      var y = W.scrollY, vh = W.innerHeight, ys = anchors.map(function (a) { var r = a.el.getBoundingClientRect(); return y + r.top + r.height / 2 - vh / 2; });
      if (y <= ys[0]) return (lastTarget = 0);
      for (var i = 0; i < anchors.length - 1; i++) {
        if (y < ys[i + 1]) { var local = (y - ys[i]) / Math.max(1, ys[i + 1] - ys[i]); return (lastTarget = i + clamp((local - .25) / .5, 0, 1)); }
      }
      return (lastTarget = anchors.length - 1);
    }
    var lastTarget = 0;
    function diff0() { return lastTarget - S; }
    function sample() {
      var i = Math.min(anchors.length - 1, Math.floor(S + 1e-4)), j = Math.min(anchors.length - 1, i + 1);
      return [anchors[i].s, anchors[j].s, clamp(S - i, 0, 1)];
    }

    return {
      frame: function (dt) {
        portraitFade();
        time += dt * (reduce ? .25 : 1);
        if (!(introState.running || introState.k < 1)) {
          // segments where the shape stays the same (ambient → ambient) carry no story, so cross them quickly
          var si = Math.min(anchors.length - 1, Math.floor(S + (diff0(S) >= 0 ? 1e-4 : -1e-4))), sj = Math.min(anchors.length - 1, si + (diff0(S) >= 0 ? 1 : -1));
          var same = sj >= 0 && anchors[si] && anchors[sj] && anchors[si].s === anchors[sj].s;
          var vmax = same && !reduce ? 2.4 : MAXV;
          var diff = targetS() - S, tv = clamp(diff * 1.2, -vmax, vmax);
          Svel += (tv - Svel) * Math.min(1, dt * 1.8);   // eases in and out, never faster than MAXV anchors/s
          S += Svel * dt;
          if (Math.abs(diff) < .002 && Math.abs(Svel) < .002) { S += diff; Svel = 0; }
        }
        var from, to, u;
        if (introState.running || introState.k < 1) { from = 0; to = 1; u = introState.k; }
        else { var sm = sample(); from = sm[0]; to = sm[1]; u = sm[2]; }
        U.uFrom.value = from; U.uTo.value = to; U.uT.value = u; U.uTime.value = time;
        U.uScanX.value = Math.sin(time * .9) * (narrow() ? 2.2 : 3.4);
        var KK = narrow() ? KM : K, a = KK[from], b = KK[to], e = ease(u);
        var L = function (j) { return a[j] + (b[j] - a[j]) * e; };
        var drift = from === 6 && to === 6 ? Math.sin(time * .1) * .6 : 0;
        cam.position.set(L(0) + drift, L(1), L(2)); look.set(L(3), L(4), L(5)); cam.lookAt(look);
        // cursor field
        var active = performance.now() - lastMove < 1600 && !reduce;
        ray.setFromCamera(ndc, cam);
        if (ray.ray.intersectPlane(plane, hit)) mTarget.set(hit.x, hit.y);
        U.uMouse.value.lerp(mTarget, .12);
        U.uRepel.value += ((active ? 1 : 0) - U.uRepel.value) * Math.min(1, dt * 3);
        // tunnel arches only show while the camera is still out in the corridor
        arches.forEach(function (m) {
          var dz = cam.position.z - m.position.z;
          m.material.opacity = dz > 0 ? Math.min(1, dz / 6) * Math.max(0, 1 - dz / 30) * .9 : 0;
        });
        BG.uTime.value = time; BG.uMouse2.value.lerp(m2, .04);
        BG.uTint.value.copy(TINT[from]).lerp(TINT[to], e);
        if (composer) composer.render(); else { rd.clear(); rd.render(bgScene, bgCam); rd.render(scene, cam); }
      }
    };
  }
})();
