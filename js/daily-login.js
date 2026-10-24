// HOLLOW NIGHT CAMP — Amber Coin wallet + timezone-aware 7-day daily login.
// Uses server RPCs only: wallet_state, daily_checkin, set_camp_timezone.
import { supabase } from '../config/supabase.js';

const COIN = 'assets/arcade/amber-coin.png';
const BOARD = 'assets/daily-login/daily-login-board.webp';
// blank paper slots on the board art, in % of the image: left, top, width, height
const SLOTS = [[15.3,43.1,14.6,18.4],[33.7,43.1,14.3,18.5],[52.0,43.2,14.7,18.3],[70.9,43.0,14.7,19.1],[15.3,66.6,14.6,19.1],[33.4,66.8,15.0,18.3],[68.6,68.5,16.0,18.4]];
const STORAGE_KEY = 'hnc-daily-login-popup-camp-date-v2';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let walletState = null;
let busy = false;
const money = n => Number(n || 0).toLocaleString();

function injectStyles() {
  if (document.querySelector('link[data-daily-login-css]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = 'css/daily-login.css?v=3';
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
      <strong class="amber-currency-total" data-daily-amber-balance>—</strong>
      <i class="amber-currency-chevron" aria-hidden="true"></i>
    </button>
    <div class="amber-currency-card" id="amberCurrencyCard" hidden>
      <div class="amber-currency-card-head"><div><span class="amber-eyebrow">YOUR WALLET</span><h2>Amber Coin</h2><p>Little treasures for your journey.</p></div><img src="${COIN}" alt="" class="amber-currency-large-coin"></div>
      <div class="amber-currency-balance"><span>Available balance</span><strong><img src="${COIN}" alt=""><b data-daily-amber-balance>—</b><small>AMBER</small></strong></div>
      <label class="amber-timezone-label" for="amberTimezoneSelect">Daily reset timezone</label>
      <select class="amber-timezone-select" id="amberTimezoneSelect">
        <option value="Asia/Jakarta">WIB — Asia/Jakarta</option><option value="Asia/Makassar">WITA — Asia/Makassar</option><option value="Asia/Jayapura">WIT — Asia/Jayapura</option>
        <option value="Asia/Singapore">Asia/Singapore</option><option value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur</option><option value="Asia/Tokyo">Asia/Tokyo</option><option value="UTC">UTC</option><option value="America/Los_Angeles">America/Los_Angeles</option><option value="America/New_York">America/New_York</option><option value="Europe/London">Europe/London</option>
      </select>
      <button class="daily-login-open" id="dailyLoginOpen" type="button"><span>▦</span><span><strong>Daily Login</strong><small>Claim your 7-day camp rewards</small></span><b aria-hidden="true">→</b></button>
      <p class="amber-currency-note">Daily rewards reset at midnight in your selected timezone. Days 1–6: 25 Amber · Day 7: 50 Amber.</p>
      <p class="amber-timezone-feedback" id="amberTimezoneFeedback" role="status"></p>
    </div>`;
  document.body.append(widget);
  const trigger = widget.querySelector('#amberCurrencyTrigger'); const card = widget.querySelector('#amberCurrencyCard');
  trigger.addEventListener('click', () => { const open = card.hidden; card.hidden = !open; trigger.setAttribute('aria-expanded', String(open)); });
  widget.querySelector('#dailyLoginOpen').addEventListener('click', openDailyLogin);
  widget.querySelector('#amberTimezoneSelect').addEventListener('change', changeTimezone);
  document.addEventListener('click', e => { if (!widget.contains(e.target)) { card.hidden = true; trigger.setAttribute('aria-expanded', 'false'); } });
}

function setBalance(balance) {
  document.querySelectorAll('[data-daily-amber-balance]').forEach(el => el.textContent = money(balance));
  document.dispatchEvent(new CustomEvent('amber:balance', { detail: { balance } }));
}

async function refreshWallet() {
  const { data, error } = await supabase.rpc('wallet_state');
  if (error || !data) { document.querySelectorAll('[data-daily-amber-balance]').forEach(el => el.textContent = '—'); throw error || new Error('wallet_state returned no data'); }
  walletState = data; setBalance(data.balance);
  const timezone = document.getElementById('amberTimezoneSelect');
  if (timezone && data.timezone_name && [...timezone.options].some(o => o.value === data.timezone_name)) timezone.value = data.timezone_name;
  return data;
}

async function changeTimezone(event) {
  const select = event.currentTarget; const feedback = document.getElementById('amberTimezoneFeedback');
  select.disabled = true; if (feedback) feedback.textContent = 'Saving timezone…';
  try {
    const { data, error } = await supabase.rpc('set_camp_timezone', { p_timezone: select.value });
    if (error) throw error;
    await refreshWallet();
    if (feedback) feedback.textContent = '✓ Timezone saved. Daily reset follows midnight in this timezone.';
  } catch (err) {
    if (feedback) feedback.textContent = 'Could not save timezone. Run the included SQL migration and try again.';
    console.warn('Timezone update failed:', err);
  } finally { select.disabled = false; }
}

function openDailyLogin() {
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

function maybeAutoPopup() {
  const today = walletState?.camp_date;
  if (!today) return; // server date is authoritative; do not guess the user's reset day in the browser.
  try { if (localStorage.getItem(STORAGE_KEY) === today) return; localStorage.setItem(STORAGE_KEY, today); } catch (_) {}
  const show = () => {
    const welcome = document.getElementById('welcomeScreen');
    if (document.body.classList.contains('stage-home') || !welcome || welcome.hidden) { openDailyLogin(); return true; }
    return false;
  };
  if (show()) return;
  const observer = new MutationObserver(() => { if (show()) observer.disconnect(); });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
  document.getElementById('enterCampButton')?.addEventListener('click', () => setTimeout(show, 50), { once: true });
}

document.addEventListener('DOMContentLoaded', async () => {
  mountWidget();
  window.addEventListener('resize', queuePlace);
  new MutationObserver(queuePlace).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  const finder = new MutationObserver(queuePlace); finder.observe(document.body, { childList: true, subtree: true }); setTimeout(() => finder.disconnect(), 10000);
  try { await refreshWallet(); } catch (err) { console.warn('Amber wallet unavailable:', err); }
  maybeAutoPopup();
});
