/* Corners Arcade: Amber Gacha Machine. Server (sql/arcade_slot.sql) decides reels, prize, cost and spin limit. */
import { supabase } from '../config/supabase.js';
import { setBalance, refreshWallet, holdBalance } from './wallet.js?v=3';

const SYM = ['amber', 'eye', 'fire', 'radio', 'pine', 'stone', 'binocular', 'd20', 'sword'];
const NAME = { amber: 'Amber', eye: 'Eye', fire: 'Fire', radio: 'Walkie Talkie', pine: 'Pinecone', stone: 'Rune Stone', binocular: 'Binoculars', d20: 'D20', sword: 'Sword' };
const $ = (id) => document.getElementById(id);
const fast = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = () => SYM[Math.floor(Math.random() * SYM.length)];
const reels = [...document.querySelectorAll('.slot-reel')];
let busy = false, state = null, cell = 0;

/* ---------- odds note (mirrors the tier odds in sql/arcade_slot.sql) ---------- */
function renderOdds() {
  const rows = [['3× Amber', 1, 1000], ['3× any other', 2.5, 500], ['2 the same', 20, 100], ['No match', 76.5, 25]];
  $('oddsPrize').innerHTML = rows.map(([n, p]) => `<li><span>${n}</span><b>${p.toFixed(2)}%</b></li>`).join('');
  $('oddsAvg').textContent = `Average return ≈ ${rows.reduce((s, [, p, v]) => s + (p / 100) * v, 0).toFixed(0)} Amber per 50 spent`;
}
renderOdds();

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
/* Lever pull sound (assets/arcade/lever-pull.mp3, trimmed so the clunk lands when the lever hits the bottom) */
let pullSnd = null;
function leverSound() {
  if (muted) return;
  try { pullSnd ??= new Audio('assets/arcade/lever-pull.mp3'); pullSnd.currentTime = 0; pullSnd.play().catch(() => {}); } catch { /* sound is optional */ }
}
/* Lever animation, measured from the reference video (30 fps): [ball dy, ball dx, stick scaleY, stick skew°] in 640px-wide machine units.
   The lever folds toward the viewer (stick shortens, ball drops to the base), holds, then springs back. */
const LEVER = [[1.2, 0.4, 0.995, 0.1], [2.9, 1.4, 0.988, 0.4], [5.8, 1.9, 0.975, 0.6], [9.9, 3.4, 0.957, 1.0], [16.6, 5.1, 0.929, 1.6], [25.1, 7.0, 0.893, 2.2], [36.2, 9.8, 0.845, 3.4], [53.1, 12.9, 0.772, 4.8], [78.6, 15.7, 0.663, 6.8], [122.2, 12.6, 0.477, 7.6], [165.7, 9.5, 0.29, 9.4], [209.3, 6.4, 0.103, 17.4], [224.7, 2.4, 0.037, 0], [229.6, 0.8, 0.02, 0], [229.5, 0.8, 0.02, 0], [224.8, 2.3, 0.037, 0], [189.0, 7.5, 0.19, 11.2], [153.2, 12.7, 0.344, 10.5], [117.4, 17.9, 0.497, 10.3], [77.4, 15.8, 0.668, 6.8], [53.9, 13.0, 0.769, 4.8], [36.7, 10.0, 0.843, 3.4], [25.0, 7.0, 0.893, 2.3], [16.2, 5.1, 0.931, 1.6], [10.2, 3.5, 0.956, 1.1], [5.7, 1.9, 0.976, 0.6], [3.4, 1.2, 0.985, 0.4], [1.2, 0.6, 0.995, 0.2], [0.1, 0.4, 1.0, 0.1]];
function leverPull() {
  if (fast) return;
  const k = $('machine').clientWidth / 640, last = LEVER.length - 1, ms = (last * 1000) / 30;
  const frames = (f) => LEVER.map((p, i) => ({ offset: i / last, ...f(p) }));
  $('leverBall').animate(frames(([dy, dx]) => ({ transform: `translate(${(dx * k).toFixed(1)}px, ${(dy * k).toFixed(1)}px)` })), { duration: ms, easing: 'linear' });
  $('leverStick').animate(frames(([, , s, sk]) => ({ transform: `scaleY(${s}) skewX(${-sk}deg)` })), { duration: ms, easing: 'linear' });
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const sfx = {
  pull() { /* replaced by leverSound() */ },
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
// The gacha shows the shared Amber Coin balance (same number as the widget and the account menu).
let bal = null;
function render() {
  const b = bal ?? state.balance;
  $('bal').textContent = Number(b).toLocaleString();
  const ok = b >= 50 && !busy;
  $('pull').disabled = !ok; $('lever').disabled = !ok; $('pull5').disabled = !(b >= 250 && !busy);
}
document.addEventListener('amber:balance', (e) => { bal = e.detail.balance; if (state) render(); });
function msg(t, cls = '') { const m = $('slotMsg'); m.textContent = t; m.className = cls; }
const ERR = { spin_limit: 'No spins left in this half-day. Come back later.', insufficient_balance: 'Not enough Amber (50 needed).', not_authenticated: 'Please sign in again.' };

async function loadState() {
  const { data, error } = await supabase.rpc('slot_state');
  if (error) { msg('Slot machine is not set up yet (run sql/amber_wallet.sql, then sql/arcade_slot.sql).', 'is-error'); console.error(error); return false; }
  state = data;
  const w = await refreshWallet(); if (!w) setBalance(data.balance);
  render(); return true;
}
const COST = 50;
const label = (p) => (p === 1000 ? 'JACKPOT! +1000 Amber' : p === 500 ? 'Triple! +500 Amber' : p === 100 ? 'Pair! +100 Amber' : '+25 Amber');
// n pulls in a row: each one is its own server spin (server still decides reels, prize and cost), animated back to back.
async function pull(n = 1) {
  if (busy || !state) return;
  if ((bal ?? state.balance) < COST * n) { msg(`Not enough Amber (${COST * n} needed).`, 'is-error'); return; }
  busy = true; render(); msg(''); $('machine').classList.add('is-pulling');
  if (!muted) ac().resume?.();
  const release = holdBalance();   // keep the number steady until the last reel stops
  const quick = n > 1;
  let won = 0, jackpots = 0, done = 0, last = null, failed = null;
  for (let k = 0; k < n; k++) {
    if (n > 1) msg(`Pull ${k + 1} of ${n}…`);
    leverPull(); leverSound();   // same animation + sound for the lever and for both buttons
    // reels start once the lever reaches the bottom (~0.45s), like the reference
    const [{ data, error }] = await Promise.all([supabase.rpc('slot_spin'), wait(fast ? 0 : 450)]);
    if (error) { failed = error; break; }
    const tick = setInterval(sfx.tick, 85);
    await Promise.all(reels.map((r, i) => spinTo(r, i, data.reels[i], quick ? 620 + i * 220 : 1100 + i * 450).then(sfx.stop)));
    clearInterval(tick); sfx.win(data.prize);
    won += data.prize; done++; last = data; if (data.prize === 1000) jackpots++;
    state = { ...state, balance: data.balance, total_won: (state.total_won || 0) + data.prize };
    if (data.prize >= 100) { $('machine').classList.add('is-win'); setTimeout(() => $('machine').classList.remove('is-win'), quick ? 500 : 1600); }
    if (quick && k < n - 1) await new Promise((r) => setTimeout(r, fast ? 0 : 250));
  }
  $('machine').classList.remove('is-pulling');
  release();
  if (last) { const w = await refreshWallet(); if (!w) setBalance(last.balance); }
  busy = false; render();
  if (failed) {
    const k = Object.keys(ERR).find((x) => failed.message.includes(x));
    msg((ERR[k] || 'Spin failed. Try again.') + (done ? ` ${done} of ${n} pulls done, +${won.toLocaleString()} Amber.` : ''), 'is-error');
    await loadState(); return;
  }
  if (n === 1) { msg(label(last.prize), jackpots ? 'is-jackpot' : last.prize >= 100 ? 'is-win' : ''); return; }
  const net = won - COST * n;
  msg(`${n} pulls: +${won.toLocaleString()} Amber (${net >= 0 ? '+' : '−'}${Math.abs(net).toLocaleString()} net)${jackpots ? ` · ${jackpots}× JACKPOT!` : ''}`, jackpots ? 'is-jackpot' : won > COST * n ? 'is-win' : '');
}
$('pull').onclick = () => pull(1); $('lever').onclick = () => pull(1); $('pull5').onclick = () => pull(5);

let ready = false;
export async function openSlot() {
  pullSnd ??= new Audio('assets/arcade/lever-pull.mp3'); pullSnd.preload = 'auto';
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
