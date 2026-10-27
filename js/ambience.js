// HOLLOW NIGHT CAMP — Ambience Mixer engine.
// Campfire / Thunder / Forest use mp3 layers from assets/sound/ambience/ (looped with crossfade).
// Rain uses assets/sound/ambience/rain.mp3 if present, otherwise a synthesised fallback.
// Preferences + play state persist in localStorage; initAmbience() runs on every page (shared.js).

export const CHANNELS = [
  { id: 'campfire', label: 'Campfire',     hint: 'Warm crackle and low embers' },
  { id: 'rain',     label: 'Rain',         hint: 'Steady rain on the canopy' },
  { id: 'thunder',  label: 'Thunderstorm', hint: 'Distant rolls and close cracks' },
  { id: 'forest',   label: 'Forest',       hint: 'Night wind, crickets, an owl' }
];

export const PRESETS = [
  { id: 'cozy',   label: 'Cozy Campfire', mix: { campfire: 70, rain: 0,  thunder: 0,  forest: 25 } },
  { id: 'rainy',  label: 'Rainy Night',   mix: { campfire: 35, rain: 70, thunder: 0,  forest: 15 } },
  { id: 'storm',  label: 'Thunderstorm',  mix: { campfire: 0,  rain: 75, thunder: 70, forest: 0 } },
  { id: 'forest', label: 'Deep Forest',   mix: { campfire: 20, rain: 0,  thunder: 0,  forest: 80 } }
];

const KEY = 'hn.ambience.v1';
const DEFAULTS = { master: 70, muted: false, playing: false, preset: 'cozy', channels: { ...PRESETS[0].mix } };

const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

export function loadPrefs() {
  const prefs = { ...DEFAULTS, channels: { ...DEFAULTS.channels } };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') {
      prefs.master = clamp(saved.master ?? prefs.master);
      prefs.muted = !!saved.muted;
      prefs.playing = !!saved.playing;
      prefs.preset = typeof saved.preset === 'string' ? saved.preset : 'custom';
      CHANNELS.forEach(({ id }) => { prefs.channels[id] = clamp(saved.channels?.[id] ?? prefs.channels[id]); });
    }
  } catch { /* storage blocked or corrupt: use defaults */ }
  return prefs;
}

export function savePrefs(prefs) {
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
}

// ---------- engine ----------
const BASE = new URL('../assets/sound/ambience/', import.meta.url).href;
// gain = dB trim so every layer sits at a similar loudness (measured from the files)
const LAYERS = {
  campfire: [{ file: 'campfire.mp3', db: 4 }],
  rain:     [{ file: 'rain.mp3', db: 0, optional: true }],
  thunder:  [{ file: 'thunder-1.mp3', db: -6 }, { file: 'thunder-2.mp3', db: -3 }],
  forest:   [{ file: 'forest-wind-owl.mp3', db: 0 }, { file: 'forest-birds-1.mp3', db: 16 }, { file: 'forest-birds-2.mp3', db: 14 }]
};

const OWNER_KEY = 'hn.ambience.owner';
const myId = Math.random().toString(36).slice(2);
let ctx = null, master = null, running = false;
const chans = {};              // id -> { gain, built, layers:[{srcs,timer,stop}] }
const bufCache = new Map();    // file -> Promise<AudioBuffer|null>
let prefsRef = loadPrefs();
let noiseWhite = null, toastEl = null, gestureBound = false;

const curve = (pct) => Math.pow(pct / 100, 2);
const rand = (a, b) => a + Math.random() * (b - a);
const dbToGain = (db) => Math.pow(10, db / 20);
const emit = () => window.dispatchEvent(new Event('ambience:state'));

function loadBuffer(file) {
  if (!bufCache.has(file)) {
    bufCache.set(file, fetch(BASE + file)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then((ab) => ctx.decodeAudioData(ab))
      .catch(() => null));
  }
  return bufCache.get(file);
}

// One looping layer: overlapping instances with equal-ish crossfades, scheduled ahead on the audio clock.
function runLayer(buf, db, out) {
  const lg = ctx.createGain(); lg.gain.value = dbToGain(db); lg.connect(out);
  const X = Math.min(2.5, buf.duration / 4);
  const L = { srcs: [], timer: 0, next: ctx.currentTime + 0.05, off: rand(0, buf.duration * 0.9), lg };
  const pump = () => {
    if (!running) return;
    while (L.next < ctx.currentTime + 90) {
      const t = L.next, off = L.off, dur = buf.duration - off;
      const s = ctx.createBufferSource(); s.buffer = buf;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(1, t + Math.min(X, dur / 2));
      g.gain.setValueAtTime(1, Math.max(t + Math.min(X, dur / 2), t + dur - X));
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      s.connect(g).connect(lg); s.start(t, off); s.stop(t + dur + 0.05);
      s.onended = () => { L.srcs = L.srcs.filter((x) => x !== s); };
      L.srcs.push(s);
      L.next = t + dur - X; L.off = 0;
    }
  };
  pump(); L.timer = setInterval(pump, 20000);
  L.stop = () => { clearInterval(L.timer); L.srcs.forEach((s) => { try { s.stop(); } catch {} }); lg.disconnect(); };
  return L;
}

function rainSynth(out) {   // fallback when rain.mp3 is missing
  noiseWhite = noiseWhite || (() => {
    const b = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  })();
  const nodes = [];
  const mk = (type, f, q, gv) => {
    const s = ctx.createBufferSource(); s.buffer = noiseWhite; s.loop = true; s.start(0, rand(0, 2));
    const a = ctx.createBiquadFilter(); a.type = type; a.frequency.value = f; a.Q.value = q;
    const g = ctx.createGain(); g.gain.value = gv;
    s.connect(a); if (type === 'highpass') { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000; a.connect(lp).connect(g); } else a.connect(g);
    g.connect(out); nodes.push(s);
  };
  mk('highpass', 700, 0.7, 0.12); mk('bandpass', 3200, 0.8, 0.05);
  return { stop: () => nodes.forEach((s) => { try { s.stop(); } catch {} }) };
}

async function buildChannel(id) {
  const c = chans[id]; if (!c || c.built) return; c.built = true;
  for (const def of LAYERS[id]) {
    const buf = await loadBuffer(def.file);
    if (!running || !chans[id]) return;          // stopped while loading
    if (buf) c.layers.push(runLayer(buf, def.db, c.gain));
    else if (id === 'rain') { c.layers.push(rainSynth(c.gain)); break; }
  }
}

function applyGains() {
  if (!ctx || !running) return;
  const now = ctx.currentTime;
  master.gain.setTargetAtTime(prefsRef.muted ? 0 : curve(prefsRef.master), now, 0.08);
  CHANNELS.forEach(({ id }) => {
    const pct = prefsRef.channels[id];
    chans[id].gain.gain.setTargetAtTime(curve(pct), now, 0.12);
    if (pct > 0) buildChannel(id);               // lazy: only fetch/decode channels in use
  });
}

// ---- resume-on-gesture (browsers block autoplay after a page load) ----
function showToast(on) {
  if (!on) { toastEl?.remove(); toastEl = null; return; }
  if (toastEl) return;
  if (!document.getElementById('hn-amb-style')) {
    const st = document.createElement('style'); st.id = 'hn-amb-style';
    st.textContent = '.hn-amb-toast{position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:9999;padding:10px 16px;border-radius:999px;background:rgba(10,15,25,.94);border:1px solid rgba(243,231,201,.3);color:#f3e7c9;font:600 13px system-ui,sans-serif;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.4)}';
    document.head.appendChild(st);
  }
  toastEl = document.createElement('div'); toastEl.className = 'hn-amb-toast'; toastEl.setAttribute('role', 'status');
  toastEl.textContent = 'Ambience ready. Tap anywhere to resume.';
  document.body.appendChild(toastEl);
}
function tryResume() {
  if (!ctx || !running) return;
  ctx.resume().catch(() => {});
}
function bindGesture() {
  if (gestureBound) return; gestureBound = true;
  const go = () => {
    tryResume();
    if (ctx?.state === 'running') { showToast(false); ['pointerdown', 'keydown', 'touchstart'].forEach((e) => document.removeEventListener(e, go, true)); gestureBound = false; }
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach((e) => document.addEventListener(e, go, true));
}

function claim() { try { localStorage.setItem(OWNER_KEY, myId); } catch {} }

function startEngine() {
  if (running) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = ctx || new AC();
  master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  running = true;
  CHANNELS.forEach(({ id }) => {
    const gain = ctx.createGain(); gain.gain.value = 0; gain.connect(master);
    chans[id] = { gain, built: false, layers: [] };
  });
  applyGains();
  ctx.onstatechange = () => { if (ctx.state === 'running') showToast(false); emit(); };
  tryResume();
  setTimeout(() => { if (running && ctx.state !== 'running') { showToast(true); bindGesture(); } }, 400);
  emit();
  return true;
}

function stopLocal() {
  if (!running) return;
  running = false;
  showToast(false);
  const m = master, ch = { ...chans };
  m.gain.setTargetAtTime(0, ctx.currentTime, 0.06);
  Object.keys(chans).forEach((k) => delete chans[k]);
  setTimeout(() => {
    Object.values(ch).forEach((c) => c.layers.forEach((l) => { try { l.stop(); } catch {} }));
    Object.values(ch).forEach((c) => c.gain.disconnect());
    m.disconnect();
  }, 300);
  emit();
}

// ---------- public API ----------
export function setPrefs(prefs) { prefsRef = prefs; applyGains(); }
export function isPlaying() { return running; }

/** Called from a user click (Sound & Music page). Persists play state so every page resumes it. */
export async function start(prefs) {
  prefsRef = prefs; prefs.playing = true; savePrefs(prefs);
  claim();
  const ok = startEngine();
  if (ok) await ctx.resume().catch(() => {});
  return ok;
}
export function stop(prefs) {
  if (prefs) { prefsRef = prefs; prefs.playing = false; savePrefs(prefs); }
  stopLocal();
}

/** Run once per page (shared.js): resume ambience if it was playing on the previous page. */
export function initAmbience() {
  prefsRef = loadPrefs();
  if (prefsRef.playing) { claim(); startEngine(); }
  window.addEventListener('storage', (e) => {
    if (e.key === OWNER_KEY && e.newValue !== myId && running) stopLocal();   // another tab took over: avoid double audio
    if (e.key === KEY) {
      prefsRef = loadPrefs();
      if (!prefsRef.playing && running) stopLocal(); else applyGains();
      emit();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    prefsRef = loadPrefs();
    if (prefsRef.playing && !running) { claim(); startEngine(); }               // switched back to a camp tab: take over
  });
}
