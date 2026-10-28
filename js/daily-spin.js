// HOLLOW NIGHT CAMP — Daily Spin. One free spin per rolling 24h (counted from the moment you spun).
// The server (sql/daily_spin.sql) owns the cooldown, the odds and every reward: RPCs daily_spin_state + daily_spin.
// The browser only animates the wheel to the slot the server returned.
import { supabase } from '../config/supabase.js';
import { refreshWallet, holdBalance } from './wallet.js?v=3';
import { activeTimezone } from './status-widget.js?v=3';

const A = 'assets/daily-spin/', COIN = 'assets/arcade/amber-coin.png', FIRE = 'assets/icons/campfire.png', FRAME = 'assets/frames/sacred-of-hollow.webp';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const money = (n) => Number(n || 0).toLocaleString();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Wheel order, clockwise from the top (slot 0 sits under the pointer at rest). Keys match sql/daily_spin.sql.
const ITEMS = [
  { key: 'amber_20', kind: 'amber', amount: 20 }, { key: 'exp_50', kind: 'exp', amount: 50 },
  { key: 'amber_50', kind: 'amber', amount: 50 }, { key: 'exp_100', kind: 'exp', amount: 100 },
  { key: 'amber_100', kind: 'amber', amount: 100 }, { key: 'exp_200', kind: 'exp', amount: 200 },
  { key: 'amber_200', kind: 'amber', amount: 200 }, { key: 'exp_300', kind: 'exp', amount: 300 },
  { key: 'amber_500', kind: 'amber', amount: 500 }, { key: 'exp_500', kind: 'exp', amount: 500 },
  { key: 'amber_1000', kind: 'amber', amount: 1000 }, { key: 'frame_sacred_of_hollow', kind: 'frame', amount: 1 },
];
// Display only — mirrors the odds in sql/daily_spin.sql (percent).
const RATES = { amber_20: 22, amber_50: 17, amber_100: 8.05, amber_200: 5, amber_500: 0.5, amber_1000: 0.25, exp_50: 20, exp_100: 13, exp_200: 8, exp_300: 4, exp_500: 2, frame_sacred_of_hollow: 0.2 };
const iconOf = (i) => (i.kind === 'amber' ? COIN : i.kind === 'exp' ? FIRE : FRAME);
const chipOf = (i) => (i.kind === 'amber' ? String(i.amount) : i.kind === 'exp' ? '+' + i.amount : 'LEGEND');
const nameOf = (i) => (i.kind === 'amber' ? `${money(i.amount)} Amber` : i.kind === 'exp' ? `${money(i.amount)} EXP` : 'Sacred of Hollow');

let st = null, offset = 0, spinning = false, angle = 0, refetching = false;

function injectStyles() {
  if (document.querySelector('link[data-daily-spin-css]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = 'css/daily-spin.css?v=1'; link.dataset.dailySpinCss = ''; document.head.append(link);
}

/* ---------- state ---------- */
async function fetchState() {
  const { data, error } = await supabase.rpc('daily_spin_state'); if (error) throw error;
  st = data; offset = Date.parse(data.server_now) - Date.now(); return data;
}
const leftMs = () => (!st || st.available || !st.next_at ? 0 : Math.max(0, Date.parse(st.next_at) - (Date.now() + offset)));
function hms(ms) { const s = Math.ceil(ms / 1000), p = (n) => String(n).padStart(2, '0'); return `${p(Math.floor(s / 3600))}:${p(Math.floor(s % 3600 / 60))}:${p(s % 60)}`; }
function readyAt() {
  try { return new Date(st.next_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: activeTimezone() || undefined }); } catch { return ''; }
}
function refetchWhenDue() {
  if (refetching || !st || st.available || leftMs() > 0) return; refetching = true;
  fetchState().catch(() => {}).finally(() => { refetching = false; paintAll(); });
}

/* ---------- Amber menu hint (button under "Daily Login" + dot on the Amber Coin pill) ---------- */
function paintHint() {
  const btn = document.getElementById('dailySpinOpen'); if (!btn || !st) return;
  const ready = st.available;
  btn.classList.toggle('is-ready', ready);
  document.getElementById('amberCurrencyTrigger')?.classList.toggle('has-spin', ready);
  const hint = document.getElementById('dailySpinHint');
  if (hint) hint.textContent = ready ? '1 free spin ready!' : `Next spin in ${hms(leftMs())}`;
  refetchWhenDue();
}
export function watchHint() {
  injectStyles();
  fetchState().then(paintHint).catch((err) => console.warn('Daily Spin unavailable (run sql/daily_spin.sql):', err));
  setInterval(() => { if (!document.hidden) paintHint(); }, 1000);
}

/* ---------- sfx (WebAudio synth, shares the arcade mute switch) ---------- */
let actx = null;
const muted = () => localStorage.getItem('slotMute') === '1';
function tone(f, d, type = 'triangle', v = 0.08, at = 0) {
  if (muted()) return;
  try {
    actx ??= new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime + at, o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + d + 0.02);
  } catch { /* sound is optional */ }
}
const sfxTick = () => tone(820, 0.04, 'square', 0.04);
const sfxWin = (big) => (big ? [523, 659, 784, 1047, 1319] : [523, 659, 784]).forEach((f, i) => tone(f, 0.28, 'triangle', 0.09, i * 0.1));

/* ---------- board ---------- */
export function openDailySpin() {
  if (document.getElementById('dailySpinOverlay')) return;
  injectStyles();
  const slots = ITEMS.map((it, i) => `<div class="ds-slot" style="--a:${i * 30}deg"><div class="ds-item${it.kind === 'frame' ? ' is-legend' : ''}"><b>${chipOf(it)}</b><img src="${iconOf(it)}" alt="" draggable="false"></div></div>`).join('');
  const rates = ITEMS.map((it) => `<li><span>${nameOf(it)}</span><b>${RATES[it.key]}%</b></li>`).join('');
  const overlay = document.createElement('div'); overlay.id = 'dailySpinOverlay'; overlay.className = 'ds-overlay';
  overlay.innerHTML = `<section class="ds-board" role="dialog" aria-modal="true" aria-label="Daily Spin">
    <button class="daily-login-close" type="button" aria-label="Close daily spin">×</button>
    <div class="ds-art">
      <img class="ds-bg" src="${A}board.webp" alt="" draggable="false">
      <h2 class="ds-title">DAILY SPIN</h2>
      <div class="ds-wheel-pos"><div class="ds-wheel" id="dsWheel"><img src="${A}wheel.webp" alt="" draggable="false">${slots}</div></div>
      <img class="ds-hub" src="${A}hub.webp" alt="" draggable="false">
      <img class="ds-pointer" id="dsPointer" src="${A}pointer.webp" alt="" draggable="false">
      <button class="ds-spin" id="dsSpin" type="button" aria-label="Spin the wheel" disabled><img src="${A}spin-btn.webp" alt="SPIN!" draggable="false"></button>
      <div class="ds-paper" id="dsPaper"><b>…</b></div>
      <button class="ds-rates-btn" id="dsRatesBtn" type="button" aria-expanded="false">Rates</button>
      <div class="ds-rates" id="dsRates" hidden><h3>Prize rates</h3><ul>${rates}</ul><p>The server picks your prize. EXP and Amber are added instantly. If you already own the frame, you get 1,000 Amber instead.</p></div>
      <div class="ds-result" id="dsResult" hidden role="alertdialog" aria-live="assertive"></div>
      <p class="ds-msg" id="dsMsg" role="status" aria-live="polite"></p>
    </div></section>`;
  document.body.append(overlay);
  angle = 0;
  const $ = (id) => overlay.querySelector('#' + id);
  const close = () => { if (spinning) return; clearInterval(timer); overlay.remove(); document.removeEventListener('keydown', esc); };
  const esc = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', esc);
  overlay.querySelector('.daily-login-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  $('dsRatesBtn').addEventListener('click', () => { const h = $('dsRates').hidden; $('dsRates').hidden = !h; $('dsRatesBtn').setAttribute('aria-expanded', String(h)); });
  $('dsSpin').addEventListener('click', doSpin);
  const timer = setInterval(paintAll, 1000);
  fetchState().then(paintAll).catch((err) => { msg('Daily Spin is not set up yet (run sql/daily_spin.sql).'); $('dsPaper').innerHTML = '<b>—</b>'; console.warn('Daily Spin unavailable:', err); });
}

const el = (id) => document.getElementById(id);
function msg(t) { const m = el('dsMsg'); if (m) m.textContent = t || ''; }
function paintAll() {
  paintHint();
  const paper = el('dsPaper'), btn = el('dsSpin'); if (!paper || !btn || !st) return;
  btn.disabled = spinning || !st.available;
  if (spinning) return;
  paper.innerHTML = st.available ? '<b>1 FREE<br>SPIN</b>' : `<b>NEXT<br>SPIN</b><small>${hms(leftMs())}</small>`;
  if (!st.available) { const t = readyAt(); msg(t ? `Next free spin at ${t} (${(activeTimezone() || '').replace(/_/g, ' ')})` : ''); } else msg('');
  refetchWhenDue();
}

/* ---------- spin ---------- */
const ERR = { not_authenticated: 'Please sign in again.', too_early: 'Your next spin is not ready yet.' };
function setRot(deg, ms, ease) { const w = el('dsWheel'); if (!w) return; w.style.transition = ms ? `transform ${ms}ms ${ease}` : 'none'; w.style.transform = `rotate(${deg}deg)`; }

function trackTicks() {
  let last = null;
  const loop = () => {
    const w = el('dsWheel'); if (!w || !spinning) return;
    const m = new DOMMatrix(getComputedStyle(w).transform), a = Math.atan2(m.b, m.a) * 180 / Math.PI;
    const seg = Math.floor((((-a + 15) % 360) + 360) % 360 / 30);   // a bone crosses the pointer when this changes
    if (last !== null && seg !== last) { const p = el('dsPointer'); p?.classList.remove('is-tick'); void p?.offsetWidth; p?.classList.add('is-tick'); sfxTick(); }
    last = seg; requestAnimationFrame(loop);
  };
  loop();
}

async function doSpin() {
  if (spinning || !st?.available) return;
  spinning = true; paintAll(); msg(''); el('dsRates').hidden = true;
  const release = holdBalance();   // keep the Amber number steady until the prize is revealed
  try { actx ??= new (window.AudioContext || window.webkitAudioContext)(); actx.resume?.(); } catch { /* optional */ }
  const cur = angle - 25;
  setRot(cur, reduceMotion ? 0 : 350, 'ease-in');   // small wind-up while the server picks
  let res;
  try {
    const [{ data, error }] = await Promise.all([supabase.rpc('daily_spin'), wait(reduceMotion ? 0 : 350)]);
    if (error) throw error; res = data;
  } catch (err) {
    console.warn('Daily Spin failed:', err);
    setRot(angle, 300, 'ease-out'); release(); spinning = false;
    const code = Object.keys(ERR).find((k) => String(err?.message || '').includes(k));
    msg(code ? ERR[code] : 'Could not spin. Please try again.');
    try { await fetchState(); } catch { /* keep old state */ }
    paintAll(); if (code) msg(ERR[code]); return;
  }
  const idx = Math.max(0, ITEMS.findIndex((i) => i.key === res.key));
  const target = -idx * 30 + (Math.random() * 16 - 8);   // land inside the slot, never on a bone
  const final = cur + 360 * 5 + ((((target - cur) % 360) + 360) % 360);
  const dur = reduceMotion ? 600 : 5200;
  setRot(final, dur, 'cubic-bezier(.12,.62,.08,1)'); trackTicks();
  await wait(dur + 80);
  angle = final % 360; setRot(angle, 0);   // same look, small numbers
  st = { ...st, available: false, next_at: res.next_at, server_now: res.server_now }; offset = Date.parse(res.server_now) - Date.now();
  spinning = false; sfxWin(res.key === 'frame_sacred_of_hollow' || res.key === 'amber_1000');
  showResult(res); release(); refreshWallet().catch(() => {}); paintAll();
}

function showResult(res) {
  const box = el('dsResult'); if (!box) return;
  const it = ITEMS.find((i) => i.key === res.key) || ITEMS[0];
  const legend = it.kind === 'frame';
  let title = nameOf(it), sub = it.kind === 'exp' ? 'Added to your Camp Rank.' : it.kind === 'amber' ? 'Added to your wallet.' : 'Legendary limited frame — find it in your Backpack!', icon = iconOf(it);
  if (legend && res.duplicate) { title = '1,000 Amber'; sub = 'You already own Sacred of Hollow — here is Amber instead.'; icon = COIN; }
  box.className = 'ds-result' + (legend && !res.duplicate ? ' is-legend' : '');
  box.innerHTML = `<img src="${icon}" alt=""><small>${legend && !res.duplicate ? 'LEGENDARY!' : 'YOU WON'}</small><strong>${it.kind === 'frame' && !res.duplicate ? title : '+' + title}</strong><p>${sub}</p><button type="button">Nice!</button>`;
  box.hidden = false; box.querySelector('button').addEventListener('click', () => { box.hidden = true; }); box.querySelector('button').focus();
}
