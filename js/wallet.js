// HOLLOW NIGHT CAMP — Amber Coin wallet (PRD §5.22). Balance display + live sync.
// The server (sql/amber_wallet.sql) owns the balance; this file only displays it and calls the RPCs.
import { supabase } from '../config/supabase.js';

const COIN = 'assets/arcade/amber-coin.png';

let state = null;
let live = false;
let channel = null;
let tab = null;      // BroadcastChannel: keeps other open tabs in sync

function ensureStyles() {
  if (document.querySelector('link[data-wallet-css]')) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = 'css/wallet.css?v=3'; l.dataset.walletCss = '';
  document.head.appendChild(l);
}

export const formatAmber = (n) => Number(n || 0).toLocaleString();

export async function getWallet() {
  const { data, error } = await supabase.rpc('wallet_state');
  if (error) { console.warn('Amber wallet unavailable (run sql/amber_wallet.sql):', error.message); return null; }
  state = data;
  return data;
}

let held = 0, pending = null;
// Hold the displayed balance while something animates (e.g. the gacha reels), so the number never spoils the result.
export function holdBalance() {
  held++; let done = false;
  return () => {
    if (done) return; done = true; held = Math.max(0, held - 1);
    if (!held && pending !== null) { const p = pending; pending = null; paint(p); }
  };
}

function paint(balance) {
  if (held) { pending = balance; return; }
  document.querySelectorAll('[data-amber-balance]').forEach((el) => { el.textContent = formatAmber(balance); });
  document.dispatchEvent(new CustomEvent('amber:balance', { detail: { balance } }));
}

// Every number on the page ([data-amber-balance]) follows this one function.
export function setBalance(balance) {
  if (state) state = { ...state, balance };
  paint(balance);
  try { tab?.postMessage({ balance }); } catch (_) {}
}

// Re-read the wallet from the server and push it to every widget (and to other tabs).
export async function refreshWallet() {
  const w = await getWallet();
  if (!w) return null;
  setBalance(w.balance);
  document.dispatchEvent(new CustomEvent('amber:wallet', { detail: w }));
  return w;
}

// Live balance: Supabase Realtime on the ledger, plus safety nets (tab focus, other tabs, 15s poll),
// so the account menu and the Amber Coin widget never need a page refresh.
export function startLive() {
  if (live) return; live = true;
  let last = 0;
  const soon = () => { const now = Date.now(); if (now - last < 1500) return; last = now; refreshWallet().catch(() => {}); };
  try { tab = new BroadcastChannel('hnc-amber'); tab.onmessage = (e) => { if (e.data && 'balance' in e.data) { if (state) state = { ...state, balance: e.data.balance }; paint(e.data.balance); } }; } catch (_) {}
  supabase.auth.getSession().then(({ data }) => {
    const uid = data?.session?.user?.id; if (!uid) return;
    try {
      channel = supabase.channel('amber-ledger-' + uid)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'amber_ledger', filter: `user_id=eq.${uid}` }, soon)
        .subscribe();
    } catch (error) { console.warn('Amber live updates unavailable:', error); }
  }).catch(() => {});
  document.addEventListener('visibilitychange', () => { if (!document.hidden) soon(); });
  window.addEventListener('focus', soon);
  setInterval(() => { if (!document.hidden) soon(); }, 15000);
  window.addEventListener('pagehide', () => { try { channel && supabase.removeChannel(channel); } catch (_) {} }, { once: true });
}

/* ---------- Main Bar: balance inside the account menu ---------- */
export async function mountWalletMenu() {
  const summary = document.querySelector('#barProfileMenu .bar-profile-summary');
  if (!summary || summary.querySelector('.amber-row')) return;
  ensureStyles();
  const row = document.createElement('div');
  row.className = 'amber-row'; row.hidden = true;
  row.innerHTML = `<img class="amber-coin-icon" src="${COIN}" alt="" width="20" height="20" draggable="false"><span class="amber-label">Amber Coin</span><strong data-amber-balance>—</strong>`;
  row.title = 'Amber Coin balance';
  summary.appendChild(row);
  const w = await refreshWallet();
  if (!w) return;
  row.hidden = false;
  startLive();
}
