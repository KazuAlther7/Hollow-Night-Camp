// Hollow Night Camp — global logo loader.
// Usage:  import { HNCLoader } from './loader.js';
//   HNCLoader.show({ label })            // manual
//   HNCLoader.hide()
//   await HNCLoader.run(() => fetchStuff(), { label })   // auto hide + error/retry
//   HNCLoader.fail('message', retryFn)
// Auto-shows on import. Opt out of auto mode: <html data-hnc-manual> and call hide() yourself.

const LOGO = 'assets/image/hollow-night-logo.png';
const CSS = 'css/loader.css';
const STUCK_MS = 15000;

const id = (document.documentElement.lang || '').startsWith('id');
const T = id
  ? { load: 'Memuat…', err: 'Gagal memuat. Hutan sedang sunyi.', retry: 'Coba lagi', close: 'Tutup',
      lines: ['Menyalakan api unggun…', 'Membaca jejak di hutan…', 'Menghitung bintang…', 'Membuka gerbang kamp…'] }
  : { load: 'Loading…', err: 'Could not load. The woods are quiet.', retry: 'Try again', close: 'Close',
      lines: ['Lighting the campfire…', 'Reading the woods…', 'Counting the stars…', 'Opening the camp gates…'] };

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = (a, b) => a + Math.random() * (b - a);

let el, fx, ctx, W = 0, dpr = 1;
let depth = 0, shownAt = 0, minMs = 0, mode = 'full', phase = 'orb', retryFn = null;
let timers = [], raf = 0, embers = [], orbits = [], phaseT = 0, leaving = false;

const later = (fn, ms) => timers.push(setTimeout(fn, ms));
const clearAll = () => { timers.forEach(clearTimeout); timers = []; cancelAnimationFrame(raf); raf = 0; };

function ensureCss() {
  if (document.querySelector(`link[href$="loader.css"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = CSS;
  document.head.appendChild(l);
}

function build(label) {
  const shards = Array.from({ length: 6 }, (_, i) =>
    `<img class="hnc-shard" src="${LOGO}" alt="" aria-hidden="true" style="--i:${i};--x:${rnd(-120, 120)}px;--y:${rnd(-120, 120)}px;--r:${rnd(-70, 70)}deg">`
  ).join('');
  const d = document.createElement('div');
  d.className = 'hnc-loader';
  d.setAttribute('role', 'status');
  d.setAttribute('aria-live', 'polite');
  d.setAttribute('aria-label', label);
  d.style.setProperty('--logo', `url("${LOGO}")`);
  d.innerHTML = `
    <div class="hnc-fog"></div>
    <div class="hnc-stage">
      <div class="hnc-orb"><i class="r1"></i><i class="r2"></i><b></b></div>
      <div class="hnc-wave"></div>
      <div class="hnc-logo">${shards}<img class="hnc-main" src="${LOGO}" alt="Hollow Night Camp"><div class="hnc-sweep"></div></div>
      <canvas class="hnc-fx" aria-hidden="true"></canvas>
    </div>
    <p class="hnc-text" aria-hidden="true">${label}</p>
    <div class="hnc-bar" aria-hidden="true"></div>
    <div class="hnc-err" role="alert">
      <p>${T.err}</p>
      <div><button type="button" data-a="retry">${T.retry}</button><button type="button" data-a="close">${T.close}</button></div>
    </div>`;
  return d;
}

function setPhase(p) { phase = p; phaseT = performance.now(); if (el) el.dataset.p = p; }

/* ---------- particles: orbiting orbs -> embers ---------- */
function initParticles() {
  fx = el.querySelector('.hnc-fx');
  dpr = Math.min(devicePixelRatio || 1, 2);
  W = el.querySelector('.hnc-stage').clientWidth || 200;
  fx.width = fx.height = W * dpr;
  ctx = fx.getContext('2d');
  ctx.scale(dpr, dpr);
  orbits = Array.from({ length: 14 }, (_, i) => ({ a: (i / 14) * Math.PI * 2, r: rnd(.40, .48) * W, s: rnd(.6, 1.4) * (i % 2 ? 1 : -1), z: rnd(1.5, 4) }));
  embers = Array.from({ length: 16 }, () => spawn(true));
}
function spawn(init) {
  return { x: W / 2 + rnd(-.32, .32) * W, y: init ? rnd(.3, .9) * W : W * rnd(.78, .92), vy: rnd(10, 30), vx: rnd(-6, 6), z: rnd(.8, 2.2), life: init ? rnd(0, 1) : 0, ttl: rnd(1.6, 3.2) };
}
let last = 0;
function tick(t) {
  raf = requestAnimationFrame(tick);
  if (document.hidden || !ctx) return;
  const dt = Math.min((t - (last || t)) / 1000, .05); last = t;
  ctx.clearRect(0, 0, W, W);
  ctx.globalCompositeOperation = 'lighter';
  if (phase === 'orb' || phase === 'shards') {
    const k = phase === 'orb' ? 1 : Math.max(0, 1 - (performance.now() - phaseT) / 600); // suck inward
    for (const o of orbits) {
      o.a += o.s * dt * (phase === 'orb' ? 1 : 3);
      const r = o.r * k, x = W / 2 + Math.cos(o.a) * r, y = W / 2 + Math.sin(o.a) * r;
      ctx.shadowBlur = 10; ctx.shadowColor = '#38bdf8';
      ctx.fillStyle = `rgba(150,215,255,${.9 * k})`;
      ctx.beginPath(); ctx.arc(x, y, o.z, 0, 7); ctx.fill();
    }
  } else if (phase === 'glow' || phase === 'solid') {
    for (const e of embers) {
      e.life += dt / e.ttl; e.y -= e.vy * dt; e.x += e.vx * dt;
      if (e.life >= 1) Object.assign(e, spawn(false));
      const a = Math.sin(Math.min(e.life, 1) * Math.PI) * .85;
      ctx.shadowBlur = 8; ctx.shadowColor = '#38bdf8';
      ctx.fillStyle = `rgba(170,230,255,${a})`;
      ctx.fillRect(e.x, e.y, e.z * 1.6, e.z * 1.6);
    }
  }
  ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over';
}

/* ---------- exit: pixel dissolve, bottom first ---------- */
function dissolve(done) {
  try {
    const img = el.querySelector('.hnc-main');
    const S = Math.round(W * .84), o = Math.round(W * .08), B = 5;
    const off = document.createElement('canvas'); off.width = off.height = S;
    const c = off.getContext('2d', { willReadFrequently: true });
    const sc = Math.min(S / img.naturalWidth, S / img.naturalHeight);
    const w = img.naturalWidth * sc, h = img.naturalHeight * sc;
    c.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
    const px = c.getImageData(0, 0, S, S).data, blocks = [];
    for (let y = 0; y < S; y += B) for (let x = 0; x < S; x += B) {
      const i = (Math.min(y + 2, S - 1) * S + Math.min(x + 2, S - 1)) * 4;
      if (px[i + 3] < 40) continue;
      blocks.push({ x: o + x, y: o + y, r: px[i], g: px[i + 1], b: px[i + 2],
        d: (1 - y / S) * 380 + rnd(0, 160), vy: rnd(30, 150), vx: rnd(-25, 25) });
    }
    cancelAnimationFrame(raf);
    el.dataset.dissolve = '1';
    const t0 = performance.now(), DUR = 950;
    (function step(t) {
      const el_ = t - t0;
      ctx.clearRect(0, 0, W, W);
      let alive = 0;
      for (const b of blocks) {
        const p = (el_ - b.d) / 600;
        if (p >= 1) continue;
        alive++;
        const q = Math.max(p, 0), s = q * q;
        const k = Math.min(q * 1.4, 1); // drift toward cyan while falling
        ctx.fillStyle = `rgba(${b.r + (56 - b.r) * k | 0},${b.g + (189 - b.g) * k | 0},${b.b + (248 - b.b) * k | 0},${1 - q})`;
        ctx.fillRect(b.x + b.vx * s, b.y + b.vy * s * 1.6, B, B);
      }
      if (alive && el_ < DUR + 400) requestAnimationFrame(step); else done();
    })(t0);
  } catch { done(); } // tainted canvas / missing image: plain fade
}

/* ---------- public API ---------- */
function show(opts = {}) {
  depth++;
  if (el && !leaving) { if (opts.label) setLabel(opts.label); return; }
  if (el) teardown();
  ensureCss();
  const first = !sessionStorage.getItem('hnc_intro');
  mode = opts.mode || (first ? 'full' : 'quick');
  if (reduced()) mode = 'quick';
  try { sessionStorage.setItem('hnc_intro', '1'); } catch {}
  leaving = false;
  el = build(opts.label || T.load);
  document.body.appendChild(el);
  document.documentElement.style.overflow = 'hidden';
  el.addEventListener('click', onClick);
  addEventListener('keydown', onKey);
  shownAt = performance.now();
  initParticles();
  raf = requestAnimationFrame(tick);
  requestAnimationFrame(() => requestAnimationFrame(() => { if (el) el.dataset.show = '1'; }));

  if (mode === 'full') {
    minMs = 2400; setPhase('orb');
    later(() => setPhase('shards'), 800);
    later(() => setPhase('solid'), 1650);
    later(() => setPhase('glow'), 2200);
    let i = 0; const txt = el.querySelector('.hnc-text');
    if (!opts.label) later(function rot() { txt.textContent = T.lines[i++ % T.lines.length]; later(rot, 1500); }, 600);
  } else {
    minMs = 600; setPhase('solid'); later(() => setPhase('glow'), 350);
  }
  later(() => fail(T.err, retryFn), opts.timeout || STUCK_MS); // never trap the user
}

function setLabel(s) {
  if (!el) return;
  el.setAttribute('aria-label', s);
  const t = el.querySelector('.hnc-text'); if (t) t.textContent = s;
}

function hide(force) {
  if (!el || leaving) return;
  depth = force ? 0 : Math.max(0, depth - 1);
  if (depth > 0) return;
  const wait = Math.max(0, shownAt + minMs - performance.now());
  later(() => {
    leaving = true;
    const finish = () => {
      if (!el) return;
      el.dataset.leaving = '1';
      later(teardown, 600);
    };
    if (mode === 'full' && !reduced() && !el.dataset.error) dissolve(finish); else finish();
  }, force ? 0 : wait);
}

function teardown() {
  clearAll();
  removeEventListener('keydown', onKey);
  el?.remove(); el = ctx = null; leaving = false; depth = 0;
  document.documentElement.style.overflow = '';
}

function fail(msg, retry) {
  if (!el) show({ mode: 'quick' });
  retryFn = retry || null;
  clearAll();
  el.dataset.error = '1';
  el.querySelector('.hnc-err p').textContent = msg || T.err;
  el.querySelector('[data-a="retry"]').hidden = false;
  el.setAttribute('aria-label', msg || T.err);
  el.querySelector('[data-a="retry"]').focus();
}

function onClick(e) {
  const a = e.target.closest('button')?.dataset.a;
  if (a === 'close') hide(true);
  if (a === 'retry') {
    const fn = retryFn; retryFn = null;
    if (fn) { teardown(); fn(); } else location.reload();
  }
}
function onKey(e) { if (e.key === 'Escape' && el?.dataset.error) hide(true); }

async function run(work, opts = {}) {
  const fn = typeof work === 'function' ? work : () => work;
  show(opts); retryFn = () => run(fn, opts);
  try { const r = await fn(); retryFn = null; hide(); return r; }
  catch (err) { console.error('[HNCLoader]', err); fail(opts.error || T.err, () => run(fn, opts)); throw err; }
}

export const HNCLoader = { show, hide, run, fail, setLabel };
window.HNCLoader = HNCLoader;

if (!document.documentElement.hasAttribute('data-hnc-manual')) {
  show();
  if (document.readyState === 'complete') later(() => hide(), 150);
  else addEventListener('load', () => hide(), { once: true });
}
