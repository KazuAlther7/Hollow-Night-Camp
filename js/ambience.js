// HOLLOW NIGHT CAMP — Ambience Mixer engine.
// Sounds are synthesised with the Web Audio API (no audio files needed).
// Preferences persist in localStorage; playback starts only after a click (browser autoplay rules).

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
const DEFAULTS = { master: 70, muted: false, preset: 'cozy', channels: { ...PRESETS[0].mix } };

const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

export function loadPrefs() {
  const prefs = { ...DEFAULTS, channels: { ...DEFAULTS.channels } };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') {
      prefs.master = clamp(saved.master ?? prefs.master);
      prefs.muted = !!saved.muted;
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
let ctx = null, master = null, running = false;
const chans = {};   // id -> { gain, timers:[], stopFns:[] }
let prefsRef = loadPrefs();
let noiseWhite = null, noiseBrown = null;

const curve = (pct) => Math.pow(pct / 100, 2);
const rand = (a, b) => a + Math.random() * (b - a);

function makeNoise(type) {
  const len = ctx.sampleRate * 3;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (type === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
  }
  return buf;
}

function loopSrc(buf) {
  const s = ctx.createBufferSource();
  s.buffer = buf; s.loop = true; s.loopStart = 0; s.loopEnd = buf.duration;
  s.start(0, rand(0, buf.duration - 0.1));
  return s;
}

function schedule(id, fn, min, max) {
  const c = chans[id];
  const tick = () => {
    if (!running) return;
    if (prefsRef.channels[id] > 0 && !prefsRef.muted) fn();
    c.timers.push(setTimeout(tick, rand(min, max) * 1000));
  };
  c.timers.push(setTimeout(tick, rand(min, max) * 1000));
}

function buildCampfire(out) {
  const rumble = loopSrc(noiseBrown);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
  const g = ctx.createGain(); g.gain.value = 0.5;
  rumble.connect(lp).connect(g).connect(out);
  chans.campfire.stopFns.push(() => rumble.stop());
  // crackles: tiny filtered noise bursts at random intervals
  const crackle = () => {
    const t = ctx.currentTime, dur = rand(0.012, 0.05);
    const s = ctx.createBufferSource(); s.buffer = noiseWhite;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rand(1200, 5200); bp.Q.value = rand(1, 4);
    const eg = ctx.createGain(); eg.gain.setValueAtTime(rand(0.25, 1), t); eg.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(bp).connect(eg).connect(out); s.start(t, rand(0, 2.5), dur + 0.02);
  };
  schedule('campfire', () => { crackle(); if (Math.random() < 0.4) setTimeout(crackle, rand(15, 70)); }, 0.05, 0.4);
}

function buildRain(out) {
  const s = loopSrc(noiseWhite);
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 700;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000;
  const g = ctx.createGain(); g.gain.value = 0.38;
  s.connect(hp).connect(lp).connect(g).connect(out);
  const s2 = loopSrc(noiseWhite);                       // brighter layer = drops on leaves
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 0.8;
  const g2 = ctx.createGain(); g2.gain.value = 0.16;
  s2.connect(bp).connect(g2).connect(out);
  chans.rain.stopFns.push(() => { s.stop(); s2.stop(); });
}

function buildThunder(out) {
  const wind = loopSrc(noiseBrown);                      // low storm bed
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160;
  const g = ctx.createGain(); g.gain.value = 0.22;
  wind.connect(lp).connect(g).connect(out);
  chans.thunder.stopFns.push(() => wind.stop());
  const roll = () => {
    const t = ctx.currentTime, len = rand(3, 6.5);
    const crack = Math.random() < 0.45;
    if (crack) {                                         // close strike: sharp crack first
      const c = ctx.createBufferSource(); c.buffer = noiseWhite;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
      const cg = ctx.createGain(); cg.gain.setValueAtTime(0.9, t); cg.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      c.connect(hp).connect(cg).connect(out); c.start(t, rand(0, 2), 0.3);
    }
    const r = ctx.createBufferSource(); r.buffer = noiseBrown;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(rand(260, 420), t + 0.05); f.frequency.exponentialRampToValueAtTime(70, t + len);
    const rg = ctx.createGain();
    rg.gain.setValueAtTime(0.0001, t); rg.gain.linearRampToValueAtTime(rand(1.1, 1.8), t + (crack ? 0.18 : 0.9));
    rg.gain.exponentialRampToValueAtTime(0.001, t + len);
    r.connect(f).connect(rg).connect(out); r.start(t, rand(0, 2), len + 0.1);
  };
  schedule('thunder', roll, 5, 15);
}

function buildForest(out) {
  const w = loopSrc(noiseWhite);                         // wind through trees
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 0.7;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.11;
  const depth = ctx.createGain(); depth.gain.value = 260;
  lfo.connect(depth).connect(bp.frequency);
  const wg = ctx.createGain(); wg.gain.value = 0.3;
  w.connect(bp).connect(wg).connect(out); lfo.start();
  // crickets: 4.4 kHz tone, pulsed fast, grouped slowly
  const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 4400;
  const pulse = ctx.createGain(); pulse.gain.value = 0.5;
  const pl = ctx.createOscillator(); pl.frequency.value = 32;
  const pd = ctx.createGain(); pd.gain.value = 0.5; pl.connect(pd).connect(pulse.gain);
  const group = ctx.createGain(); group.gain.value = 0.5;
  const gl = ctx.createOscillator(); gl.frequency.value = 0.45;
  const gd = ctx.createGain(); gd.gain.value = 0.5; gl.connect(gd).connect(group.gain);
  const cg = ctx.createGain(); cg.gain.value = 0.045;
  osc.connect(pulse).connect(group).connect(cg).connect(out);
  osc.start(); pl.start(); gl.start();
  chans.forest.stopFns.push(() => { w.stop(); lfo.stop(); osc.stop(); pl.stop(); gl.stop(); });
  const hoot = (delay, hz) => {
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(hz, t); o.frequency.exponentialRampToValueAtTime(hz * 0.88, t + 0.5);
    const e = ctx.createGain(); e.gain.setValueAtTime(0.0001, t);
    e.gain.linearRampToValueAtTime(0.28, t + 0.08); e.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    o.connect(e).connect(out); o.start(t); o.stop(t + 0.65);
  };
  schedule('forest', () => { const hz = rand(360, 440); hoot(0, hz); hoot(0.8, hz * 0.92); }, 14, 32);
}

const BUILDERS = { campfire: buildCampfire, rain: buildRain, thunder: buildThunder, forest: buildForest };

function applyGains() {
  if (!ctx) return;
  const now = ctx.currentTime;
  master.gain.setTargetAtTime(prefsRef.muted ? 0 : curve(prefsRef.master), now, 0.08);
  CHANNELS.forEach(({ id }) => chans[id]?.gain.gain.setTargetAtTime(curve(prefsRef.channels[id]), now, 0.12));
}

// ---------- public API ----------
export function setPrefs(prefs) { prefsRef = prefs; applyGains(); }
export function isPlaying() { return running; }

export async function start(prefs) {
  prefsRef = prefs;
  if (running) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = ctx || new AC();
  if (ctx.state === 'suspended') await ctx.resume();
  noiseWhite = noiseWhite || makeNoise('white');
  noiseBrown = noiseBrown || makeNoise('brown');
  master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  running = true;
  CHANNELS.forEach(({ id }) => {
    const gain = ctx.createGain(); gain.gain.value = 0; gain.connect(master);
    chans[id] = { gain, timers: [], stopFns: [] };
    BUILDERS[id](gain);
  });
  applyGains();
  return true;
}

export function stop() {
  if (!running) return;
  running = false;
  const m = master, c = ctx;
  m.gain.setTargetAtTime(0, c.currentTime, 0.06);
  setTimeout(() => {
    Object.values(chans).forEach((ch) => { ch.timers.forEach(clearTimeout); ch.stopFns.forEach((f) => { try { f(); } catch {} }); ch.gain.disconnect(); });
    Object.keys(chans).forEach((k) => delete chans[k]);
    m.disconnect();
  }, 300);
}
