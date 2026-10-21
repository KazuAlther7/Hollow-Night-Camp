// HOLLOW NIGHT CAMP — top-right status widget: retro neon flip clock + realtime online readers.
// Mounted once per page by initPage() in shared.js.
//
// CLOCK: uses the device clock + Intl (no network polling). Timezone comes from Settings (localStorage
//        'hnc_timezone'), falling back to the browser timezone when unset or invalid. 24-hour format.
// ONLINE: Supabase Realtime Presence on channel 'camp-online'. One presence key per browser tab
//        (kept in sessionStorage so page changes / reconnects do not count twice). Count = number of
//        distinct keys currently present, including the current visitor. Only the count is shown; the
//        tracked payload holds no identity. Supabase drops a session when its socket closes or its
//        heartbeat stops (stale tabs expire on their own).

import { supabase } from '../config/supabase.js';

const TZ_KEY = 'hnc_timezone';
const SESSION_KEY = 'hnc_presence_key';
const COMPACT_KEY = 'hnc_status_compact';
const CHANNEL = 'camp-online';

// ---------- timezone helpers (also used by settings.html) ----------
export function browserTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; }
}

function isValidTimezone(tz) {
  try { new Intl.DateTimeFormat('en-GB', { timeZone: tz }); return true; } catch (e) { return false; }
}

export function getSavedTimezone() {
  try { return localStorage.getItem(TZ_KEY) || ''; } catch (e) { return ''; }
}

export function setSavedTimezone(tz) {
  try { if (tz) localStorage.setItem(TZ_KEY, tz); else localStorage.removeItem(TZ_KEY); } catch (e) {}
  window.dispatchEvent(new Event('hnc:timezone'));
}

export function activeTimezone() {
  const saved = getSavedTimezone();
  return saved && isValidTimezone(saved) ? saved : browserTimezone();
}

// 'HH:MM' (24h) in the given timezone. Hour cycle h23 avoids the "24:00" quirk.
export function timeIn(tz, date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || '00';
  return get('hour') + ':' + get('minute');
}

export function timezoneList() {
  try {
    if (Intl.supportedValuesOf) return Intl.supportedValuesOf('timeZone');
  } catch (e) {}
  return ['UTC', 'Asia/Jakarta', 'Asia/Tokyo', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Australia/Sydney'];
}

// ---------- flip digit ----------
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function makeDigit() {
  const half = (cls) => {
    const span = document.createElement('span');
    const node = document.createElement('div');
    node.className = 'fd-half ' + cls;
    node.append(span);
    return { node, span };
  };
  const top = half('fd-top');
  const bottom = half('fd-bottom');
  const flipTop = half('fd-flip-top');
  const flipBottom = half('fd-flip-bottom');

  const root = document.createElement('div');
  root.className = 'fd';
  root.setAttribute('aria-hidden', 'true');
  root.append(top.node, bottom.node, flipTop.node, flipBottom.node);

  let current = null;
  const setAll = (value) => {
    [top, bottom, flipTop, flipBottom].forEach((part) => { part.span.textContent = value; });
  };
  const finish = () => {
    root.classList.remove('flipping');
    bottom.span.textContent = current;
  };
  flipBottom.node.addEventListener('animationend', () => { if (root.classList.contains('flipping')) finish(); });

  return {
    node: root,
    set(value) {
      if (value === current) return;
      const previous = current;
      if (previous === null || reduceMotion() || document.hidden) {
        current = value;
        root.classList.remove('flipping');
        setAll(value);
        return;
      }
      if (root.classList.contains('flipping')) finish();
      current = value;
      top.span.textContent = value;          // revealed behind the falling card
      flipTop.span.textContent = previous;   // old upper half falls forward
      flipBottom.span.textContent = value;   // new lower half swings down
      void root.offsetWidth;                 // restart the CSS animation
      root.classList.add('flipping');
    }
  };
}

// ---------- widget ----------
let mounted = false;

export function mountStatusWidget() {
  if (mounted || document.getElementById('hnStatus')) return;
  mounted = true;

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL('../css/status.css?v=2', import.meta.url).href;
  document.head.append(css);

  const digits = [makeDigit(), makeDigit(), makeDigit(), makeDigit()];
  const colon = Object.assign(document.createElement('span'), { className: 'hn-colon', textContent: ':' });
  colon.setAttribute('aria-hidden', 'true');
  const row = document.createElement('div');
  row.className = 'hn-flip-row';
  row.append(digits[0].node, digits[1].node, colon, digits[2].node, digits[3].node);

  const tzLabel = Object.assign(document.createElement('span'), { className: 'hn-clock-tz' });
  const clock = document.createElement('a');
  clock.className = 'hn-clock';
  clock.href = 'settings.html#clock';
  clock.setAttribute('role', 'img');
  clock.title = 'Change timezone in Settings';
  clock.append(row, tzLabel);

  const lamp = Object.assign(document.createElement('span'), { className: 'hn-lamp' });
  lamp.setAttribute('aria-hidden', 'true');
  const count = Object.assign(document.createElement('strong'), { className: 'hn-online-count', textContent: '…' });
  const label = Object.assign(document.createElement('span'), { className: 'hn-online-label', textContent: 'online' });
  const online = document.createElement('div');
  online.className = 'hn-online is-loading';
  online.setAttribute('role', 'status');
  online.setAttribute('aria-live', 'off');
  online.title = 'Readers in camp right now';
  online.append(lamp, count, label);

  const widget = document.createElement('aside');
  widget.id = 'hnStatus';
  widget.className = 'hn-status';
  widget.setAttribute('aria-label', 'Camp status');
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'hn-status-toggle';
  toggle.setAttribute('aria-controls', 'hnStatus');
  widget.append(clock, online, toggle);
  document.body.append(widget);

  // full = clock + online readers; compact = online readers + indicator lamp only
  let compact = false;
  try { compact = localStorage.getItem(COMPACT_KEY) === '1'; } catch (e) {}
  const paintCompact = () => {
    widget.classList.toggle('is-compact', compact);
    toggle.setAttribute('aria-expanded', String(!compact));
    toggle.setAttribute('aria-label', compact ? 'Show clock' : 'Hide clock');
    toggle.title = compact ? 'Show clock' : 'Hide clock';
  };
  paintCompact();
  toggle.addEventListener('click', () => {
    compact = !compact;
    try { localStorage.setItem(COMPACT_KEY, compact ? '1' : '0'); } catch (e) {}
    paintCompact();
  });

  // ----- clock -----
  let timer = null;
  function renderClock() {
    const tz = activeTimezone();
    const text = timeIn(tz);
    [text[0], text[1], text[3], text[4]].forEach((char, index) => digits[index].set(char));
    tzLabel.textContent = tz.replace(/_/g, ' ');
    clock.setAttribute('aria-label', 'Current time ' + text + ', timezone ' + tz.replace(/_/g, ' '));
  }
  function schedule() {
    clearTimeout(timer);
    renderClock();
    const now = new Date();
    const wait = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 50;
    timer = setTimeout(schedule, wait);
  }
  schedule();
  window.addEventListener('hnc:timezone', schedule);
  window.addEventListener('storage', (event) => { if (event.key === TZ_KEY) schedule(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });

  // ----- online readers (Realtime Presence) -----
  let key = null;
  try {
    key = sessionStorage.getItem(SESSION_KEY);
    if (!key) { key = crypto.randomUUID(); sessionStorage.setItem(SESSION_KEY, key); }
  } catch (e) {}
  key = key || crypto.randomUUID();

  const showCount = (n) => {
    online.classList.remove('is-loading', 'is-unavailable');
    count.textContent = String(Math.max(1, n)); // the current visitor is always counted
    label.textContent = n === 1 ? 'online' : 'online';
  };
  const showUnavailable = () => {
    online.classList.remove('is-loading');
    online.classList.add('is-unavailable');
    count.textContent = '–';
    online.title = 'Live count unavailable right now';
  };

  try {
    const channel = supabase.channel(CHANNEL, { config: { presence: { key } } });
    const sync = () => showCount(Object.keys(channel.presenceState()).length);

    channel
      .on('presence', { event: 'sync' }, sync)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try { await channel.track({ online_at: new Date().toISOString() }); } catch (e) { showUnavailable(); }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          showUnavailable();
        }
      });

    // coming back from a backgrounded mobile tab: make sure we are tracked again
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && channel.state === 'joined') channel.track({ online_at: new Date().toISOString() }).catch(() => {});
    });
    window.addEventListener('pagehide', () => { supabase.removeChannel(channel); });
  } catch (error) {
    showUnavailable();
  }
}
