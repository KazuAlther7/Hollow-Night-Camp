/* HOLLOW NIGHT CAMP — global logo-led loader (PRD §5.17).
   Classic <script> in <head> so the overlay paints with the very first frame (no flash of half-built page).

   Flow (frames from assets/loader/):
     intro   1 orb -> 2 burst (shockwave + shards) -> 3 -> 4 -> 5 logo forms -> 7/8 glow loop
     exit    6 pixel dissolve -> fade
   First visit of a session plays the full intro; later page loads use a short glow-only version.

   API (window.HNLoader):
     ready()                 shell is built (called by initPage)
     hold(label) -> release  keep the loader up while data loads
     track(promise, label)   hold() until the promise settles; returns the promise
     fail(message, retryFn)  show error + Retry / Continue (never traps the reader)
     leave()                 short fade-in while navigating away
     mini(text)              small inline loader element for tiny async states
*/
(function () {
  'use strict';
  if (window.HNLoader) return;

  var script = document.currentScript;
  var BASE = script && script.src ? new URL('../assets/loader/', script.src).href : 'assets/loader/';
  var SEEN_KEY = 'hnc_loader_seen';
  var WATCHDOG_MS = 15000;
  var MESSAGES = ['Lighting the fire', 'Following the trail', 'Counting the campers', 'Listening to the woods'];

  var doc = document.documentElement;
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var lowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
                 (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
                 window.innerWidth < 640;

  var S = null;          // current instance
  var holds = 0;
  var shellReady = false;

  /* ---------------- particles: blue spirit motes, warm embers, burst shards ---------------- */
  function sprite(rgb) {
    var c = document.createElement('canvas');
    c.width = c.height = 48;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(24, 24, 0, 24, 24, 24);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.22, 'rgba(' + rgb + ',0.9)');
    grad.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 48, 48);
    return c;
  }

  function createParticles(canvas, stage) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;

    var dpr = lowPower ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    var sprBlue = sprite('110,185,255');
    var sprWarm = sprite('255,170,80');
    var sprWhite = sprite('225,242,255');
    var MOTES = lowPower ? 9 : 20;
    var EMBERS = lowPower ? 7 : 15;
    var list = [];
    var w = 0, h = 0, cx = 0, cy = 0, size = 200;
    var raf = 0, last = 0, running = false;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var r = stage.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
      size = r.width || 200;
    }

    function spawn(kind, seeded) {
      var life, p;
      if (kind === 'ember') {
        life = 4 + Math.random() * 4;
        p = { k: 'ember', spr: sprWarm, x: cx + (Math.random() - 0.5) * w * 0.55, y: h + 12,
              vx: (Math.random() - 0.5) * 10, vy: -(20 + Math.random() * 38), s: 7 + Math.random() * 9,
              life: life, age: 0, seed: Math.random() * 6.28, sway: 8 + Math.random() * 14 };
        if (seeded) { p.age = Math.random() * life; p.y = h * (0.35 + Math.random() * 0.65); }
      } else if (kind === 'mote') {
        var a = Math.random() * 6.283;
        var r = size * (0.55 + Math.random() * 0.9);
        life = 2.6 + Math.random() * 2.8;
        p = { k: 'mote', spr: Math.random() < 0.35 ? sprWhite : sprBlue, x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r,
              vx: Math.cos(a) * 5, vy: -(6 + Math.random() * 14), s: 4 + Math.random() * 7,
              life: life, age: 0, seed: Math.random() * 6.28, sway: 3 + Math.random() * 5 };
        if (seeded) p.age = Math.random() * life;
      }
      list.push(p);
    }

    function burst() {
      var n = lowPower ? 14 : 26;
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.283;
        var sp = 150 + Math.random() * 230;
        list.push({ k: 'shard', spr: Math.random() < 0.5 ? sprWhite : sprBlue, x: cx, y: cy,
                    vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, s: 4 + Math.random() * 7,
                    life: 0.7 + Math.random() * 0.6, age: 0, seed: 0, sway: 0 });
      }
    }

    function count(kind) {
      var n = 0;
      for (var i = 0; i < list.length; i++) if (list[i].k === kind) n++;
      return n;
    }

    function frame(now) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (count('mote') < MOTES && Math.random() < 0.35) spawn('mote');
      if (count('ember') < EMBERS && Math.random() < 0.25) spawn('ember');

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      for (var i = list.length - 1; i >= 0; i--) {
        var p = list[i];
        p.age += dt;
        if (p.age >= p.life) { list.splice(i, 1); continue; }
        var t = p.age / p.life;
        var alpha;

        if (p.k === 'shard') {
          var f = Math.exp(-2.4 * dt);
          p.vx *= f; p.vy *= f;
          alpha = (1 - t) * 0.9;
        } else {
          alpha = Math.min(t / 0.15, 1) * Math.min((1 - t) / 0.4, 1);
          alpha *= p.k === 'ember' ? 0.72 + 0.28 * Math.sin(p.age * 9 + p.seed) : 0.85;
          p.vx += Math.sin(p.age * 1.6 + p.seed) * p.sway * dt;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.drawImage(p.spr, p.x - p.s, p.y - p.s, p.s * 2, p.s * 2);
      }
      ctx.globalAlpha = 1;
    }

    function start() {
      if (running) return;
      resize();
      for (var i = 0; i < MOTES; i++) spawn('mote', true);
      for (var j = 0; j < EMBERS; j++) spawn('ember', true);
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
      window.addEventListener('resize', resize);
      document.addEventListener('visibilitychange', onVis);
    }

    function onVis() {
      if (document.hidden) { running = false; cancelAnimationFrame(raf); }
      else if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
      list.length = 0;
    }

    return { start: start, stop: stop, burst: burst, resize: resize };
  }

  /* ---------------- overlay build / teardown ---------------- */
  function frameImg(n) {
    return '<img class="hnl-f" data-f="' + n + '" src="' + BASE + 'frame-' + n + '.webp" alt="" decoding="async" draggable="false">';
  }

  function build(mode, rm) {
    var frames = mode === 'full' ? [1, 2, 3, 4, 5, 6, 7, 8] : (rm ? [5] : [7, 8, 6]);
    var el = document.createElement('div');
    el.id = 'hnLoader';
    el.className = 'hnl hnl-' + mode + (rm ? ' hnl-rm' : '');
    el.setAttribute('role', 'status');
    el.setAttribute('aria-busy', 'true');
    el.innerHTML =
      '<div class="hnl-bg" aria-hidden="true"></div>' +
      '<div class="hnl-mist hnl-mist-a" aria-hidden="true"></div>' +
      '<div class="hnl-mist hnl-mist-b" aria-hidden="true"></div>' +
      '<canvas class="hnl-canvas" aria-hidden="true"></canvas>' +
      '<div class="hnl-center">' +
        '<div class="hnl-stage" role="img" aria-label="Hollow Night Camp logo">' +
          '<div class="hnl-halo" aria-hidden="true"></div>' +
          '<div class="hnl-ring hnl-ring-a" aria-hidden="true"></div>' +
          '<div class="hnl-ring hnl-ring-b" aria-hidden="true"></div>' +
          '<div class="hnl-frames" aria-hidden="true">' + frames.map(frameImg).join('') + '</div>' +
          '<div class="hnl-sheen" aria-hidden="true"></div>' +
        '</div>' +
        '<p class="hnl-label" aria-hidden="true"><span class="hnl-label-text"></span><span class="hnl-dots"><i>.</i><i>.</i><i>.</i></span></p>' +
        '<div class="hnl-bar" aria-hidden="true"><i></i></div>' +
        '<div class="hnl-error" role="alert">' +
          '<p class="hnl-error-text"></p>' +
          '<div class="hnl-actions">' +
            '<button type="button" class="hnl-btn hnl-btn-primary" data-hnl="retry">Try again</button>' +
            '<button type="button" class="hnl-btn" data-hnl="dismiss">Continue anyway</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<span class="hnl-sr">Loading Hollow Night Camp</span>';

    doc.appendChild(el);
    doc.classList.add('hnl-lock');

    var inst = {
      el: el, mode: mode, rm: rm, started: Date.now(), timers: [], frames: {}, cur: 0,
      exiting: false, leaving: false, errored: false, particles: null, msg: 0, retry: null
    };
    var imgs = el.querySelectorAll('.hnl-f');
    for (var i = 0; i < imgs.length; i++) inst.frames[imgs[i].getAttribute('data-f')] = imgs[i];

    el.querySelector('[data-hnl="retry"]').addEventListener('click', function () {
      if (inst.retry) { var fn = inst.retry; clearError(inst); fn(); } else { window.location.reload(); }
    });
    el.querySelector('[data-hnl="dismiss"]').addEventListener('click', function () { exit(inst, true); });

    return inst;
  }

  function later(inst, fn, ms) {
    var id = setTimeout(function () { if (S === inst) fn(); }, ms);
    inst.timers.push(id);
    return id;
  }

  function clearTimers(inst) {
    for (var i = 0; i < inst.timers.length; i++) { clearTimeout(inst.timers[i]); clearInterval(inst.timers[i]); }
    inst.timers.length = 0;
  }

  function setFrame(inst, n, fade) {
    if (!inst.frames[n]) return;
    inst.el.style.setProperty('--hnl-fade', (fade == null ? 120 : fade) + 'ms');
    if (inst.cur === n) return;
    if (inst.cur && inst.frames[inst.cur]) inst.frames[inst.cur].classList.remove('on');
    inst.frames[n].classList.add('on');
    inst.cur = n;
  }

  function setLabel(inst, text) {
    var node = inst.el.querySelector('.hnl-label-text');
    if (!node || node.textContent === text) return;
    if (!node.textContent) { node.textContent = text; return; }
    node.classList.add('is-swap');
    setTimeout(function () { node.textContent = text; node.classList.remove('is-swap'); }, 260);
  }

  function startRotation(inst) {
    setLabel(inst, MESSAGES[0]);
    if (inst.rm) return;
    var id = setInterval(function () {
      if (S !== inst || inst.exiting || inst.customLabel) return;
      inst.msg = (inst.msg + 1) % MESSAGES.length;
      setLabel(inst, MESSAGES[inst.msg]);
    }, 2300);
    inst.timers.push(id);
  }

  function burstFx(inst) {
    inst.el.classList.remove('fx-burst');
    void inst.el.offsetWidth;
    inst.el.classList.add('fx-burst');
    if (inst.particles) inst.particles.burst();
  }

  function startLoop(inst) {
    inst.el.classList.add('is-looping');
    var n = 7;
    setFrame(inst, 7, 420);
    var id = setInterval(function () {
      if (S !== inst || inst.exiting || inst.errored) return;
      n = n === 7 ? 8 : 7;
      setFrame(inst, n, 460);
    }, 950);
    inst.timers.push(id);
  }

  function playIntro(inst) {
    var steps = [
      [0,    function () { setFrame(inst, 1, 60); }],
      [650,  function () { setFrame(inst, 2, 40); burstFx(inst); }],
      [940,  function () { setFrame(inst, 3, 50); }],
      [1110, function () { setFrame(inst, 4, 50); }],
      [1290, function () { setFrame(inst, 5, 70); }],
      [1560, function () { startLoop(inst); }]
    ];
    steps.forEach(function (s) { later(inst, s[1], s[0]); });
  }

  /* ---------------- lifecycle ---------------- */
  function start(opts) {
    if (S) return S;
    opts = opts || {};
    var seen = false;
    try { seen = sessionStorage.getItem(SEEN_KEY) === '1'; } catch (e) {}
    var mode = (seen || reduced || opts.short) ? 'short' : 'full';
    if (mode === 'full') { try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) {} }

    var inst = build(mode, reduced);
    S = inst;
    inst.minAt = inst.started + (mode === 'full' ? 2500 : 520);

    var canvas = inst.el.querySelector('.hnl-canvas');
    if (!reduced) inst.particles = createParticles(canvas, inst.el.querySelector('.hnl-stage'));

    startRotation(inst);

    if (reduced) {
      setFrame(inst, 5, 200);
    } else if (mode === 'full') {
      var first = inst.frames[1];
      var go = function () { if (S !== inst || inst.began) return; inst.began = true; if (inst.particles) inst.particles.start(); playIntro(inst); };
      if (first && !first.complete) {
        first.addEventListener('load', go, { once: true });
        first.addEventListener('error', go, { once: true });
        later(inst, go, 700);
      } else { go(); }
    } else {
      if (inst.particles) inst.particles.start();
      startLoop(inst);
    }

    later(inst, function () {
      if (!inst.exiting) fail('The camp is taking longer than usual.', null);
    }, WATCHDOG_MS);

    return inst;
  }

  function destroy(inst) {
    if (!inst) return;
    clearTimers(inst);
    if (inst.particles) inst.particles.stop();
    if (inst.el.parentNode) inst.el.parentNode.removeChild(inst.el);
    if (S === inst) S = null;
    doc.classList.remove('hnl-lock');
  }

  function exit(inst, force) {
    inst = inst || S;
    if (!inst || inst.exiting) return;
    inst.exiting = true;
    clearTimers(inst);
    inst.el.setAttribute('aria-busy', 'false');
    inst.el.classList.remove('is-error');

    if (inst.mode === 'full' && !inst.rm && inst.frames[6] && !force) {
      setFrame(inst, 6, 70);
      inst.el.classList.add('is-out');
      setTimeout(function () { inst.el.classList.add('is-gone'); }, 520);
      setTimeout(function () { destroy(inst); }, 520 + 440);
    } else {
      inst.el.classList.add('is-gone');
      setTimeout(function () { destroy(inst); }, 360);
    }
  }

  var checkTimer = 0;
  function check() {
    if (!S || S.exiting || S.leaving) return;
    if (!shellReady || holds > 0) return;
    var wait = S.minAt - Date.now();
    clearTimeout(checkTimer);
    if (wait > 0) { checkTimer = setTimeout(check, wait + 10); return; }
    exit(S);
  }

  function clearError(inst) {
    inst.errored = false;
    inst.el.classList.remove('is-error');
    inst.el.setAttribute('role', 'status');
  }

  function fail(message, retryFn) {
    if (!S || S.exiting) return;
    S.errored = true;
    S.retry = retryFn || null;
    S.el.querySelector('.hnl-error-text').textContent = message || 'Something went wrong around the campfire.';
    S.el.classList.add('is-error');
    S.el.setAttribute('aria-busy', 'false');
    setFrame(S, S.frames[8] ? 8 : (S.frames[5] ? 5 : 7), 300);
    var btn = S.el.querySelector('[data-hnl="retry"]');
    if (btn) { try { btn.focus({ preventScroll: true }); } catch (e) {} }
  }

  /* ---------------- public API ---------------- */
  function hold(label) {
    holds++;
    if (S && label) { S.customLabel = true; setLabel(S, label); }
    var done = false;
    return function release() {
      if (done) return;
      done = true;
      holds = Math.max(0, holds - 1);
      if (S) S.customLabel = false;
      if (holds === 0) { clearTimeout(checkTimer); checkTimer = setTimeout(check, 120); }
    };
  }

  function track(promise, label) {
    var release = hold(label);
    var p = Promise.resolve(promise);
    p.then(release, release);
    return p;
  }

  function ready() {
    shellReady = true;
    // small grace so page scripts can register their own holds right after initPage resolves
    clearTimeout(checkTimer);
    checkTimer = setTimeout(check, 260);
  }

  function leave() {
    if (S && !S.exiting) return;
    if (S) destroy(S);
    var inst = build('short', reduced);
    S = inst;
    inst.leaving = true;
    inst.el.classList.add('is-leaving');
    setFrame(inst, reduced ? 5 : 7, 80);
    startRotation(inst);
    // safety: a cancelled navigation must never leave the page covered
    later(inst, function () { destroy(inst); }, 3200);
  }

  function mini(text) {
    var wrap = document.createElement('div');
    wrap.className = 'hnl-mini';
    wrap.setAttribute('role', 'status');
    var logo = document.createElement('span');
    logo.className = 'hnl-mini-logo';
    var img = document.createElement('img');
    img.src = BASE + 'frame-7.webp';
    img.alt = '';
    img.decoding = 'async';
    logo.appendChild(img);
    var label = document.createElement('span');
    label.textContent = text || 'Loading…';
    wrap.appendChild(logo);
    wrap.appendChild(label);
    return wrap;
  }

  window.HNLoader = { ready: ready, hold: hold, track: track, fail: fail, leave: leave, mini: mini, exit: function () { exit(S, true); } };

  /* ---------------- boot ---------------- */
  start();

  // page restored from the back/forward cache: drop any leftover overlay
  window.addEventListener('pageshow', function (event) {
    if (event.persisted && S && S.leaving) destroy(S);
  });

  // same-origin link clicks: fade the loader in while the next page loads
  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (document.body && document.body.classList.contains('editor-mode')) return;
    var a = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!a || a.hasAttribute('download')) return;
    if (a.target && a.target !== '_self') return;
    var url;
    try { url = new URL(a.href, location.href); } catch (e) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return;
    leave();
  });
})();
