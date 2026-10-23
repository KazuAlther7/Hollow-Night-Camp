// HOLLOW NIGHT CAMP — Amber wallet (PRD §5.22). Balance + daily check-in.
// The server (sql/amber_wallet.sql) owns the balance; this file only displays it and calls the RPCs.
import { supabase } from '../config/supabase.js';

const FLAME = '<svg class="amber-flame" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12.4 2.2c.3 2.6-.9 4-2.3 5.5-1.5 1.6-3.1 3.3-3.1 6.2A5.6 5.6 0 0 0 12.6 21c3.3 0 5.9-2.4 5.9-5.8 0-2.3-1-3.8-2.1-5.1-.4 1-1 1.7-1.8 2.1.5-3.7-.2-7.6-2.2-9.99z"/></svg>';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

let state = null;

function ensureStyles() {
  if (document.querySelector('link[data-wallet-css]')) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = 'css/wallet.css?v=1'; l.dataset.walletCss = '';
  document.head.appendChild(l);
}

export const formatAmber = (n) => Number(n || 0).toLocaleString();

export async function getWallet() {
  const { data, error } = await supabase.rpc('wallet_state');
  if (error) { console.warn('Amber wallet unavailable (run sql/amber_wallet.sql):', error.message); return null; }
  state = data;
  return data;
}

export function setBalance(balance) {
  if (state) state = { ...state, balance };
  document.querySelectorAll('[data-amber-balance]').forEach((el) => { el.textContent = formatAmber(balance); });
  document.dispatchEvent(new CustomEvent('amber:balance', { detail: { balance } }));
}

/* ---------- Main Bar: balance inside the account menu ---------- */
export async function mountWalletMenu() {
  const summary = document.querySelector('#barProfileMenu .bar-profile-summary');
  if (!summary || summary.querySelector('.amber-row')) return;
  ensureStyles();
  const row = document.createElement('div');
  row.className = 'amber-row'; row.hidden = true;
  row.innerHTML = `${FLAME}<span class="amber-label">Amber</span><strong data-amber-balance>—</strong>`;
  row.title = 'Amber balance';
  summary.appendChild(row);
  const w = await getWallet();
  if (!w) return;
  setBalance(w.balance);
  row.hidden = false;
}

/* ---------- Campfire: daily check-in card ---------- */
function untilText(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (!(ms > 0)) return 'soon';
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return h ? `${h}h ${m}m` : `${Math.max(m, 1)}m`;
}

export async function initCheckin() {
  const card = document.getElementById('checkinCard');
  if (!card) return;
  ensureStyles();
  const btn = document.getElementById('checkinButton');
  const text = document.getElementById('checkinText');
  const status = document.getElementById('checkinStatus');
  let timer = null;

  const paint = () => {
    if (!state) return;
    card.classList.toggle('is-claimed', state.claimed_today);
    btn.disabled = state.claimed_today;
    btn.textContent = state.claimed_today ? 'Checked in' : `Check in · +${state.reward}`;
    text.textContent = state.claimed_today
      ? `Fire's lit for today. Next check-in in ${untilText(state.next_claim_at)}.`
      : `Warm your hands by the fire and collect ${state.reward} Amber.`;
  };

  const w = await getWallet();
  if (!w) return;                       // not set up yet: card stays hidden
  card.hidden = false;
  setBalance(w.balance);
  paint();
  timer = setInterval(paint, 60000);

  btn.addEventListener('click', async () => {
    if (btn.disabled) return;
    btn.disabled = true; status.textContent = '';
    const { data, error } = await supabase.rpc('daily_checkin');   // server decides; retry-safe
    if (error) {
      status.textContent = error.message.includes('not_authenticated') ? 'Please sign in again.' : 'Check-in failed. Try again.';
      status.className = 'checkin-status is-error';
      btn.disabled = false; return;
    }
    state = { ...state, claimed_today: true, next_claim_at: data.next_claim_at };
    setBalance(data.balance); paint();
    status.className = 'checkin-status';
    status.textContent = data.claimed ? `+${data.amount} Amber added to your wallet.` : 'Already checked in today.';
    if (data.claimed && !reduce) {
      card.classList.add('is-pop'); setTimeout(() => card.classList.remove('is-pop'), 900);
    }
  });
  window.addEventListener('pagehide', () => clearInterval(timer), { once: true });
}
