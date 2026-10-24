// HOLLOW NIGHT CAMP — Amber Coin wallet + timezone-aware 7-day daily login.
// Uses server RPCs only: wallet_state, daily_checkin, set_camp_timezone.
import { supabase } from '../config/supabase.js';
import { setBalance, refreshWallet as syncWallet, startLive } from './wallet.js?v=3';
import { activeTimezone } from './status-widget.js?v=3';

const COIN = 'assets/arcade/amber-coin.png';
const BOARD = 'assets/daily-login/daily-login-board.webp';
// blank paper slots on the board art, in % of the image: left, top, width, height
const SLOTS = [[15.3,43.1,14.6,18.4],[33.7,43.1,14.3,18.5],[52.0,43.2,14.7,18.3],[70.9,43.0,14.7,19.1],[15.3,66.6,14.6,19.1],[33.4,66.8,15.0,18.3],[68.6,68.5,16.0,18.4]];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let walletState = null;
let busy = false;
const money = n => Number(n || 0).toLocaleString();

function injectStyles() {
  if (document.querySelector('link[data-daily-login-css]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = 'css/daily-login.css?v=6';
  link.dataset.dailyLoginCss = ''; document.head.append(link);
}

function createUI() {
  if (document.getElementById('amberCurrencyWidget')) return;
  injectStyles();
  const widget = document.createElement('section');
  widget.id = 'amberCurrencyWidget'; widget.className = 'amber-currency-widget';
  widget.innerHTML = `
    <button class="amber-currency-trigger" id="amberCurrencyTrigger" type="button" aria-expanded="false" aria-controls="amberCurrencyCard" aria-label="Amber Coin">
      <img class="amber-currency-coin" src="${COIN}" alt="">
      <span class="amber-currency-name">Amber Coin</span>
      <strong class="amber-currency-total" data-amber-balance>—</strong>
      <i class="amber-currency-chevron" aria-hidden="true"></i>
    </button>
    <div class="amber-currency-card" id="amberCurrencyCard" hidden>
      <div class="amber-currency-card-head"><div><span class="amber-eyebrow">YOUR WALLET</span><h2>Amber Coin</h2><p>Little treasures for your journey.</p></div><img src="${COIN}" alt="" class="amber-currency-large-coin"></div>
      <div class="amber-currency-balance"><span>Available balance</span><strong><img src="${COIN}" alt=""><b data-amber-balance>—</b><small>AMBER</small></strong></div>
      <div class="amber-newreader" id="amberNewReader" hidden>
        <img src="${COIN}" alt="" draggable="false">
        <span><strong>New Reader</strong><small>A welcome gift for joining the camp</small></span>
        <button class="amber-newreader-claim" id="amberNewReaderClaim" type="button">Claim +500</button>
      </div>
      <p class="amber-newreader-msg" id="amberNewReaderMsg" role="status" aria-live="polite"></p>
      <button class="daily-login-open" id="dailyLoginOpen" type="button"><span><img src="${COIN}" alt="" draggable="false"></span><span><strong>Daily Login</strong><small>Claim your 7-day camp rewards</small></span><b class="daily-login-open-arrow" aria-hidden="true"></b></button>
      <p class="amber-currency-note">Days 1–6: 25 Amber · Day 7: 50 Amber.</p>
      <p class="amber-currency-note amber-timezone-note">Resets at midnight in <b id="amberTimezoneName">—</b> · <a href="settings-clock.html">Clock &amp; timezone</a></p>
    </div>`;
  document.body.append(widget);
  const trigger = widget.querySelector('#amberCurrencyTrigger'); const card = widget.querySelector('#amberCurrencyCard');
  trigger.addEventListener('click', () => { const open = card.hidden; card.hidden = !open; trigger.setAttribute('aria-expanded', String(open)); });
  widget.querySelector('#dailyLoginOpen').addEventListener('click', openDailyLogin);
  widget.querySelector('#amberNewReaderClaim').addEventListener('click', claimNewReader);
  document.addEventListener('click', e => { if (!widget.contains(e.target)) { card.hidden = true; trigger.setAttribute('aria-expanded', 'false'); } });
}

// Daily reset timezone = the Settings › Clock & timezone choice (saved on the account so the server can reset at midnight there).
let tzBusy = false, tzFailed = '';
function paintTimezone() {
  const el = document.getElementById('amberTimezoneName'); if (el) el.textContent = (walletState?.timezone_name || activeTimezone() || '—').replace(/_/g, ' ');
}
async function syncTimezoneFromSettings() {
  if (tzBusy || !walletState) return;
  const tz = activeTimezone();
  if (!tz || tz === walletState.timezone_name || tz === tzFailed) { paintTimezone(); return; }
  tzBusy = true;
  try {
    const { error } = await supabase.rpc('set_camp_timezone', { p_timezone: tz }); if (error) throw error;
    tzFailed = ''; await refreshWallet();
  } catch (err) { tzFailed = tz; console.warn('Timezone sync failed:', err); }
  finally { tzBusy = false; paintTimezone(); }
}
window.addEventListener('hnc:timezone', () => { tzFailed = ''; syncTimezoneFromSettings(); });

// New Reader gift: 500 Amber, once. Visible only while the server says it is still unclaimed.
function paintNewReader() {
  const open = walletState?.new_reader_claimed === false;   // undefined = SQL not installed yet -> stay hidden
  const box = document.getElementById('amberNewReader'); if (box) box.hidden = !open;
  document.getElementById('amberCurrencyTrigger')?.classList.toggle('has-gift', open);
}
let newReaderBusy = false;
async function claimNewReader(event) {
  if (newReaderBusy) return; newReaderBusy = true;
  const button = event.currentTarget, msg = document.getElementById('amberNewReaderMsg'); button.disabled = true;
  try {
    const { data, error } = await supabase.rpc('claim_new_reader'); if (error) throw error;
    await refreshWallet();
    if (msg) msg.textContent = data?.claimed ? `✓ ${money(data.amount)} Amber added to your wallet!` : 'Already claimed.';
    setTimeout(() => { if (msg) msg.textContent = ''; }, 5000);
  } catch (err) { if (msg) msg.textContent = 'Could not claim the gift. Please try again.'; button.disabled = false; console.warn('New Reader claim failed:', err); }
  finally { newReaderBusy = false; }
}

async function refreshWallet() {
  const data = await syncWallet();
  if (!data) { document.querySelectorAll('[data-amber-balance]').forEach(el => el.textContent = '—'); throw new Error('wallet_state returned no data'); }
  walletState = data; paintTimezone(); paintNewReader();
  return data;
}

// live updates (realtime / other tab / focus): keep the open Daily Login board in step
document.addEventListener('amber:wallet', e => {
  walletState = e.detail; paintTimezone(); paintNewReader(); syncTimezoneFromSettings();
  if (document.getElementById('dailyLoginGrid')) renderDays().catch(() => {});
});

function openDailyLogin() {
  if (document.getElementById('dailyLoginOverlay')) return;
  if (document.getElementById('dailyLoginOverlay')) return;
  const overlay = document.createElement('div'); overlay.id = 'dailyLoginOverlay'; overlay.className = 'daily-login-overlay';
  overlay.innerHTML = `<section class="daily-login-board" role="dialog" aria-modal="true" aria-label="Daily Login — 7 days rewards">
    <button class="daily-login-close" type="button" aria-label="Close daily login">×</button>
    <div class="daily-login-art"><img src="${BOARD}" alt="Daily Login — 7 days rewards" draggable="false"><div class="daily-login-grid" id="dailyLoginGrid" aria-live="polite"></div><p class="daily-login-feedback" id="dailyLoginFeedback" role="status" aria-live="polite"></p></div></section>`;
  document.body.append(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('.daily-login-close').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  const esc = e => { if (e.key === 'Escape' && document.getElementById('dailyLoginOverlay')) { close(); document.removeEventListener('keydown', esc); } };
  document.addEventListener('keydown', esc);
  renderDays().catch(err => { const f = overlay.querySelector('#dailyLoginFeedback'); if (f) f.textContent = 'Daily rewards are temporarily unavailable. Please try again later.'; console.warn('Daily login unavailable:', err); });
}

async function renderDays() {
  const grid = document.getElementById('dailyLoginGrid'); if (!grid) return;
  if (!walletState) await refreshWallet();
  const currentDay = Math.min(7, Math.max(1, Number(walletState?.streak_day || 1)));
  const claimedToday = Boolean(walletState?.claimed_today);
  grid.innerHTML = '';
  for (let day = 1; day <= 7; day++) {
    const done = day < currentDay || (claimedToday && day === currentDay); // earlier days of the streak count as claimed
    const claimable = day === currentDay && !claimedToday;
    const item = document.createElement(claimable ? 'button' : 'article');
    if (claimable) item.type = 'button';
    item.className = 'daily-login-day' + (day === 7 ? ' is-day7' : '') + (done ? ' is-claimed' : '') + (claimable ? ' is-claimable' : '');
    const [l, t, w, h] = SLOTS[day - 1];
    item.style.cssText = `left:${l}%;top:${t}%;width:${w}%;height:${h}%`;
    const reward = day === 7 ? 50 : 25;
    item.innerHTML = `<span class="daily-login-reward-coin"><img src="${COIN}" alt="Amber Coin"><b>${reward}</b>${done ? '<i class="daily-login-check" aria-hidden="true">✓</i>' : ''}</span><span class="daily-login-reward-label">AMBER</span><span class="daily-login-claimed">${done ? 'CLAIMED' : claimable ? 'CLAIM' : ''}</span>`;
    if (claimable) { item.setAttribute('aria-label', `Claim day ${day} reward: ${reward} Amber`); item.addEventListener('click', claimDailyReward); }
    else item.setAttribute('aria-label', `Day ${day}: ${reward} Amber${done ? ', claimed' : ''}`);
    grid.append(item);
  }
}

async function claimDailyReward(event) {
  if (busy) return; busy = true; const button = event.currentTarget; button.disabled = true; const label = button.querySelector('.daily-login-claimed'); if (label) label.textContent = '…';
  const feedback = document.getElementById('dailyLoginFeedback');
  try {
    const { data, error } = await supabase.rpc('daily_checkin'); if (error) throw error;
    await refreshWallet();
    if (data?.claimed) { walletState.claimed_today = true; walletState.streak_day = data.streak_day ?? walletState.streak_day; walletState.balance = data.balance ?? walletState.balance; setBalance(walletState.balance); }
    if (feedback) { feedback.textContent = data?.claimed === false ? 'Already claimed today — see you after the next midnight.' : `✓ ${money(data?.amount)} Amber added to your wallet!`; feedback.classList.toggle('is-success', data?.claimed !== false); }
    await renderDays(); if (!reduceMotion) document.querySelector('.daily-login-board')?.classList.add('is-celebrating');
  } catch (err) { if (feedback) feedback.textContent = 'Could not claim your reward. Please try again.'; button.disabled = false; if (label) label.textContent = 'RETRY'; console.warn('Daily login claim failed:', err); }
  finally { busy = false; }
}

// Amber Coin sits right under the clock/online widget (.hn-status), aligned to its right edge.
let placeQueued = false, statusObserved = null;
function placeWidget() {
  placeQueued = false;
  const widget = document.getElementById('amberCurrencyWidget'); if (!widget) return;
  const status = document.querySelector('.hn-status');
  if (!status || getComputedStyle(status).display === 'none') { widget.hidden = true; return; }
  if (statusObserved !== status && 'ResizeObserver' in window) { statusObserved = status; new ResizeObserver(queuePlace).observe(status); }
  const r = status.getBoundingClientRect();
  widget.hidden = false;
  widget.style.top = Math.round(r.bottom + 10) + 'px';
  widget.style.right = Math.max(8, Math.round(window.innerWidth - r.right)) + 'px';
}
function queuePlace() { if (!placeQueued) { placeQueued = true; requestAnimationFrame(placeWidget); } }
function mountWidget() { createUI(); queuePlace(); }

// The board opens every time the reader comes through the Welcome transition ("ENTER THE CAMP"), never on plain page loads.
function popupAfterWelcome() {
  document.getElementById('enterCampButton')?.addEventListener('click', () => setTimeout(openDailyLogin, 450));
}

async function boot() {
  mountWidget();
  popupAfterWelcome();
  window.addEventListener('resize', queuePlace);
  new MutationObserver(queuePlace).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  const finder = new MutationObserver(queuePlace); finder.observe(document.body, { childList: true, subtree: true }); setTimeout(() => finder.disconnect(), 10000);
  try { await refreshWallet(); await syncTimezoneFromSettings(); startLive(); } catch (err) { console.warn('Amber wallet unavailable:', err); }
}
// this module is also loaded late by shared.js, after DOMContentLoaded has already fired
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
