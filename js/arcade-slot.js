/* Corners Arcade: Amber Slot Machine. Server (sql/arcade_slot.sql) decides reels, prize, cost and spin limit. */
import { supabase } from '../config/supabase.js';

const SYM = ['amber', 'eye', 'fire', 'radio', 'pine', 'stone', 'binocular', 'd20', 'sword'];
const NAME = { amber: 'Amber', eye: 'Eye', fire: 'Fire', radio: 'Walkie Talkie', pine: 'Pinecone', stone: 'Rune Stone', binocular: 'Binoculars', d20: 'D20', sword: 'Sword' };
const $ = (id) => document.getElementById(id);
const fast = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = () => SYM[Math.floor(Math.random() * SYM.length)];
const reels = [...document.querySelectorAll('.slot-reel')];
let busy = false, state = null, cell = 0;

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
    a.onfinish = () => { s.style.filter = ''; setStrip(reel, ids.slice(N)); done(); };
  });
}
function untilReset(iso) {
  const m = Math.max(0, Math.round((new Date(iso) - Date.now()) / 60000));
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
function render() {
  $('bal').textContent = state.balance.toLocaleString();
  $('spinsLeft').textContent = `${state.spins_left} / 10 spins left · resets in ${untilReset(state.resets_at)}`;
  const ok = state.spins_left > 0 && state.balance >= 50 && !busy;
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
  const { data, error } = await supabase.rpc('slot_spin');
  if (error) {
    const k = Object.keys(ERR).find((x) => error.message.includes(x));
    msg(ERR[k] || 'Spin failed. Try again.', 'is-error'); $('machine').classList.remove('is-pulling'); busy = false; await loadState(); return;
  }
  await Promise.all(reels.map((r, i) => spinTo(r, i, data.reels[i], 1100 + i * 450)));
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
