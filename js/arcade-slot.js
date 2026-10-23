/* Corners Arcade: Amber Slot Machine. Server (sql/arcade_slot.sql) decides reels, prize, cost and spin limit. */
import { supabase } from '../config/supabase.js';

const SYM = ['amber', 'eye', 'fire', 'radio', 'pine', 'stone', 'binocular', 'd20', 'sword'];
const NAME = { amber: 'Amber', eye: 'Eye', fire: 'Fire', radio: 'Walkie Talkie', pine: 'Pinecone', stone: 'Rune Stone', binocular: 'Binoculars', d20: 'D20', sword: 'Sword' };
const $ = (id) => document.getElementById(id);
const fast = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = () => SYM[Math.floor(Math.random() * SYM.length)];
const reels = [...document.querySelectorAll('.slot-reel')];
let busy = false, state = null, cell = 0;

/* ---------- sfx (WebAudio synth, no files) ---------- */
let actx = null, muted = localStorage.getItem('slotMute') === '1';
const ac = () => (actx ??= new (window.AudioContext || window.webkitAudioContext)());
function tone(f, d, type = 'sine', v = 0.12, at = 0, to) {
  if (muted) return; const c = ac(), t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + 0.02);
}
function noise(d, v = 0.1) {
  if (muted) return; const c = ac(), n = Math.floor(c.sampleRate * d), b = c.createBuffer(1, n, c.sampleRate), x = b.getChannelData(0);
  for (let i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource(), g = c.createGain(); s.buffer = b; g.gain.value = v; s.connect(g).connect(c.destination); s.start();
}
const sfx = {
  pull() { noise(0.08, 0.15); tone(120, 0.18, 'square', 0.1, 0, 60); tone(900, 0.04, 'square', 0.05, 0.12); },
  tick() { tone(700 + Math.random() * 200, 0.025, 'square', 0.03); },
  stop() { tone(160, 0.1, 'triangle', 0.18, 0, 70); noise(0.04, 0.08); },
  win(p) {
    const seq = p >= 1000 ? [523, 659, 784, 1047, 784, 1047, 1319] : p >= 500 ? [523, 659, 784, 1047] : p >= 100 ? [523, 784] : [660];
    seq.forEach((f, i) => tone(f, 0.18, 'triangle', 0.14, i * 0.1));
    if (p >= 1000) for (let i = 0; i < 8; i++) tone(1500 + Math.random() * 1500, 0.08, 'sine', 0.05, 0.7 + i * 0.06);
  },
};
const muteBtn = $('mute');
const paintMute = () => { muteBtn.textContent = muted ? 'Sound: off' : 'Sound: on'; };
muteBtn.onclick = () => { muted = !muted; localStorage.setItem('slotMute', muted ? '1' : '0'); paintMute(); if (!muted) sfx.stop(); };
paintMute();

function cellEl(id) {
  const d = document.createElement('div'); d.className = 'slot-cell'; d.style.height = cell + 'px';
  const i = new Image(); i.src = `assets/arcade/${id}.png`; i.alt = NAME[id]; i.draggable = false; d.appendChild(i); return d;
}
function setStrip(reel, ids) {
  const s = reel.firstElementChild; s.replaceChildren(...ids.map(cellEl)); s.style.transform = 'none'; reel.dataset.cur = ids.join();
}
function measure() {
  cell = reels[0].clientHeight / 3;
  reels.forEach((r) => setStrip(r, (r.dataset.cur || [rnd(), rnd(), rnd()].join()).split(',')));
}
function spinTo(reel, i, target, ms) {
  const cur = reel.dataset.cur.split(','), N = 14 + i * 6;
  const ids = [...cur, ...Array.from({ length: N - 3 }, rnd), rnd(), target, rnd()];
  const s = reel.firstElementChild; s.replaceChildren(...ids.map(cellEl)); s.style.filter = 'blur(1.5px)';
  return new Promise((done) => {
    const a = s.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${-N * cell}px)` }], { duration: fast ? 300 : ms, easing: 'cubic-bezier(.15,.75,.2,1)', fill: 'forwards' });
    a.onfinish = () => { a.cancel(); s.style.filter = ''; setStrip(reel, ids.slice(N)); done(); };
  });
}
function untilReset(iso) {
  const m = Math.max(0, Math.round((new Date(iso) - Date.now()) / 60000));
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
function render() {
  $('bal').textContent = state.balance.toLocaleString();
  const unl = state.spins_left === null;
  $('spinsLeft').textContent = unl ? 'Author: unlimited spins' : `${state.spins_left} / 10 spins left · resets in ${untilReset(state.resets_at)}`;
  const ok = (unl || state.spins_left > 0) && state.balance >= 50 && !busy;
  $('pull').disabled = !ok; $('lever').disabled = !ok;
}
function msg(t, cls = '') { const m = $('slotMsg'); m.textContent = t; m.className = cls; }
const ERR = { spin_limit: 'No spins left in this half-day. Come back later.', insufficient_balance: 'Not enough Amber Coin (50 needed).', not_authenticated: 'Please sign in again.' };

async function loadState() {
  const { data, error } = await supabase.rpc('slot_state');
  if (error) { msg('Slot machine is not set up yet (run sql/arcade_slot.sql).', 'is-error'); console.error(error); return false; }
  state = data; render(); return true;
}
async function pull() {
  if (busy || !state) return;
  busy = true; render(); msg(''); $('machine').classList.add('is-pulling');
  if (!muted) ac().resume?.();
  sfx.pull();
  const { data, error } = await supabase.rpc('slot_spin');
  if (error) {
    const k = Object.keys(ERR).find((x) => error.message.includes(x));
    msg(ERR[k] || 'Spin failed. Try again.', 'is-error'); $('machine').classList.remove('is-pulling'); busy = false; await loadState(); return;
  }
  const tick = setInterval(sfx.tick, 85);
  await Promise.all(reels.map((r, i) => spinTo(r, i, data.reels[i], 1100 + i * 450).then(sfx.stop)));
  clearInterval(tick); sfx.win(data.prize);
  $('machine').classList.remove('is-pulling');
  state = { ...state, balance: data.balance, spins_left: data.spins_left, resets_at: data.resets_at, total_won: (state.total_won || 0) + data.prize };
  busy = false; render();
  const jack = data.prize === 1000;
  msg(jack ? `JACKPOT! +1000 Amber Coin` : data.prize === 500 ? `Triple! +500 Amber Coin` : data.prize === 100 ? `Pair! +100 Amber Coin` : `+25 Amber Coin`, jack ? 'is-jackpot' : data.prize >= 100 ? 'is-win' : '');
  if (data.prize >= 100) { $('machine').classList.add('is-win'); setTimeout(() => $('machine').classList.remove('is-win'), 1600); }
}
$('pull').onclick = pull; $('lever').onclick = pull;

let ready = false;
export async function openSlot() {
  if (!ready) { ready = true; new ResizeObserver(() => { if (!busy && reels[0].clientHeight) measure(); }).observe(reels[0]); }
  measure(); await loadState();
}
export async function openBoard() {
  const ol = $('boardList'); ol.textContent = 'Loading…';
  const { data, error } = await supabase.rpc('slot_leaderboard', { lim: 20 });
  if (error) { ol.textContent = 'Leaderboard is not set up yet.'; console.error(error); return; }
  if (!data.length) { ol.textContent = 'No scores yet. Be the first to pull the lever!'; return; }
  ol.replaceChildren(...data.map((r) => {
    const li = document.createElement('li'); if (r.is_me) li.className = 'is-me';
    const mk = (c, t) => { const s = document.createElement('span'); s.className = c; s.textContent = t; return s; };
    li.append(mk('b-pos', '#' + r.pos), mk('b-name', r.nickname), mk('b-jack', r.jackpots ? `${r.jackpots}× jackpot` : ''), mk('b-score', Number(r.total_won).toLocaleString()));
    return li;
  }));
}
