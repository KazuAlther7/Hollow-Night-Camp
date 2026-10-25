// HOLLOW NIGHT CAMP — Camp Profile card (PRD §13.5, Step E). Opens from the account button in the main bar.
// A scaled "stage": every piece is positioned in design units (see css/profile-card.css), so it looks the same at any width.
// Data shown is real: nickname, avatar, role, bio, join date, live Amber balance. Rank / badges / streak are placeholders for later systems.

import { el } from './dom.js?v=2';

const A = 'assets/profile/';
const SETTINGS = 'settings-profile.html';
const FULL_PROFILE = 'settings-profile.html'; // swap for the Personal Cabin route once it exists

let cssReady = null;
function ensureStyles() {
  if (cssReady) return cssReady;
  cssReady = new Promise((resolve) => {
    const link = el('link', { rel: 'stylesheet', href: 'css/profile-card.css?v=5' });
    link.addEventListener('load', resolve); link.addEventListener('error', resolve);
    document.head.append(link);
  });
  return cssReady;
}

const img = (name, cls, extra = {}) => el('img', { class: 'pc-i ' + cls, src: A + name + '.webp', alt: '', 'aria-hidden': 'true', draggable: 'false', ...extra });
const NS = 'http://www.w3.org/2000/svg';
function silhouette() {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 220 320'); s.setAttribute('class', 'pc-i pc-silhouette'); s.setAttribute('aria-hidden', 'true');
  s.innerHTML = '<g fill="#2b0e14"><circle cx="112" cy="62" r="38"/><path d="M72 52c-6-30 18-46 44-44 26 0 44 16 38 42-8-12-20-18-40-18-18 0-32 6-42 20z"/>'
    + '<rect x="34" y="118" width="86" height="104" rx="22"/><path d="M78 108h72c26 0 40 20 40 48v66h-38v82h-30v-82h-8v82h-30v-82h-18z"/>'
    + '<rect x="176" y="120" width="8" height="190" rx="4"/><circle cx="180" cy="116" r="9"/></g>'
    + '<rect x="46" y="140" width="22" height="28" rx="3" fill="#f5e3b4" opacity=".85"/>';
  return s;
}

// Night Owl appears on the card only once the reader has a reading streak of at least this many days.
export const NIGHT_OWL_MIN_STREAK = 3;

// streak: current reading streak in days (number), or null while the streak system is not connected (row and owl stay hidden).
export async function openProfileCard({ profile, user, isAuthor, streak = null, opener, onSignOut }) {
  if (document.querySelector('dialog.pc-dialog')) return;
  await ensureStyles();

  const nick = (profile?.nickname || 'Camper').trim();
  const initial = nick.charAt(0).toUpperCase();
  const joined = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-GB') : '—';
  const campId = (user?.id || '').replace(/-/g, '').slice(0, 7).toUpperCase() || '—';
  const bio = (profile?.bio || '').trim();
  const hasStreak = Number.isFinite(streak) && streak >= 0;
  const nightOwl = hasStreak && streak >= NIGHT_OWL_MIN_STREAK;

  const closeBtn = el('button', { class: 'pc-i pc-close', type: 'button', 'aria-label': 'Close Camp Profile' });
  const tab = (cls, icon, label, attrs) => {
    const inner = [el('img', { src: A + icon + '.webp', alt: '', 'aria-hidden': 'true', draggable: 'false' }), el('span', { text: label })];
    return attrs.href ? el('a', { class: 'pc-i pc-tab ' + cls, ...attrs }, inner)
      : el('button', { class: 'pc-i pc-tab ' + cls, type: 'button', ...attrs }, inner);
  };
  const plank = (cls, sprite, label, attrs) => {
    const kids = [el('img', { src: A + sprite + '.webp', alt: '', 'aria-hidden': 'true', draggable: 'false' }), el('span', { text: label })];
    return attrs.href ? el('a', { class: 'pc-i pc-btn ' + cls, ...attrs }, kids)
      : el('button', { class: 'pc-i pc-btn ' + cls, type: 'button', ...attrs }, kids);
  };
  const row = (i, label, value) => el('div', { class: 'pc-i pc-row pc-row-' + i }, el('span', { text: label + ': ' }), value);

  const amber = el('b', { 'data-amber-balance': '', text: '…' });
  const editPencil = (href, label) => el('a', { class: 'pc-pencil', href, 'aria-label': label }, el('img', { src: A + 'edit.webp', alt: '', 'aria-hidden': 'true', draggable: 'false' }));

  const rows = [['Role', el('b', { text: isAuthor ? 'Author' : 'Reader' })], ['Amber Coin', amber]];
  if (hasStreak) rows.push(['Reading Streak', el('b', { text: streak + (streak === 1 ? ' Day' : ' Days') })]);
  rows.push(['Joined', el('b', { text: joined })]);

  const slot = (i) => {
    const add = el('button', { class: 'pc-slot-add', type: 'button', 'aria-label': 'Add badge (coming soon)', 'aria-disabled': 'true', title: 'Badges are coming soon',
      onclick: (e) => { const b = e.currentTarget; b.classList.remove('is-nope'); void b.offsetWidth; b.classList.add('is-nope'); } });
    return el('div', { class: 'pc-i pc-slot pc-slot-' + i }, el('img', { src: A + 'badge-slot.webp', alt: '', 'aria-hidden': 'true', draggable: 'false' }), add);
  };

  const stage = el('div', { class: 'pc-stage' + (hasStreak ? ' pc-has-streak' : '') },
    el('h2', { class: 'pc-sr', id: 'pcTitle', text: 'Camp Profile' }),
    img('title', 'pc-title'),
    img('book', 'pc-book'),
    img('stats-book', 'pc-st pc-st-book'),
    img('stats-title', 'pc-st pc-st-titleimg'),

    el('nav', { 'aria-label': 'Profile sections' },
      tab('pc-tab-1', 'tab-profile', 'Profile', { href: '#', 'aria-current': 'page', onclick: (e) => { e.preventDefault(); setView('profile'); } }),
      tab('pc-tab-2', 'tab-stats', 'Statistik', { onclick: () => setView('stats') }),
      tab('pc-tab-3', 'tab-settings', 'Settings', { href: SETTINGS })),

    // left page: the character card
    silhouette(),
    img('rank-hex', 'pc-hex'),
    nightOwl && img('owl', 'pc-owl'),
    el('div', { class: 'pc-i pc-nick' }, el('span', { text: nick }), editPencil(SETTINGS, 'Edit nickname')),

    // right page
    el('div', { class: 'pc-i pc-ring' },
      profile?.avatar_url ? el('img', { src: profile.avatar_url, alt: '', draggable: 'false' }) : el('span', { text: initial })),
    el('div', { class: 'pc-i pc-rank' }, el('b', { text: 'Camp Rank' }), el('small', { text: 'soon' })),
    el('div', { class: 'pc-i pc-bar', role: 'img', 'aria-label': 'Camp rank progress: not available yet' }, el('i')),
    el('div', { class: 'pc-i pc-campid', text: 'Camp ID: ' + campId }),
    rows.map(([label, value], i) => row(i, label, value)),
    el('section', { class: 'pc-i pc-manifesto', 'aria-labelledby': 'pcManifestoTitle' },
      el('header', {}, el('h3', { id: 'pcManifestoTitle', text: 'Personal Manifesto' }), editPencil(SETTINGS, 'Edit personal manifesto')),
      el('p', { class: bio ? '' : 'is-empty', text: bio || 'This camper wrote nothing.' })),
    el('div', { class: 'pc-slots', role: 'group', 'aria-label': 'Badge slots (empty)' },
      [0, 1, 2].map(slot)),

    closeBtn,

    // action planks
    plank('pc-btn-1', 'btn-orange', 'View Full Profile', { href: FULL_PROFILE }),
    plank('pc-btn-2', 'btn-brown', 'Edit Profile', { href: SETTINGS }),
    plank('pc-btn-3', 'btn-teal', 'Collectibles', { disabled: '', title: 'Coming soon' }),
    plank('pc-btn-4', 'btn-red', 'Sign Out', { id: 'pcSignOut' })
  );

  // ---- Statistik view: same book, the character card and nickname are gone (CSS hides them), these pieces take their place ----
  const NSV = 'http://www.w3.org/2000/svg';
  const ringSvg = () => {
    const svg = document.createElementNS(NSV, 'svg');
    svg.setAttribute('viewBox', '0 0 439 383'); svg.setAttribute('class', 'pc-st-ringsvg'); svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '<defs><linearGradient id="pcRingGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc24a"/><stop offset="1" stop-color="#ee7d0f"/></linearGradient></defs>'
      + '<circle cx="220" cy="180" r="128" fill="none" stroke="#2f2118" stroke-opacity=".75" stroke-width="24"/>'
      + '<circle id="pcStRing" cx="220" cy="180" r="128" fill="none" stroke="url(#pcRingGrad)" stroke-width="18" stroke-linecap="round" transform="rotate(-90 220 180)" stroke-dasharray="804.25" stroke-dashoffset="804.25"/>';
    return svg;
  };
  const note = (cls, ...kids) => el('section', { class: 'pc-i pc-st pc-st-note ' + cls }, el('i', { class: 'pc-st-tape', 'aria-hidden': 'true' }), ...kids);
  const label = (icon, text) => el('div', { class: 'pc-st-head' }, icon && el('img', { src: icon, alt: '', 'aria-hidden': 'true', draggable: 'false' }), el('span', { text }));
  const sub = (id, text = '') => el('small', { class: 'pc-st-sub', id, text });
  const kv = (text, id) => el('div', { class: 'pc-st-kv' }, el('span', { text }), el('b', { id, text: '…' }));

  stage.append(
    el('section', { class: 'pc-i pc-st pc-st-ring', 'aria-label': 'Chapters read' },
      el('img', { src: A + 'stats-frame.webp', alt: '', 'aria-hidden': 'true', draggable: 'false' }),
      ringSvg(),
      el('div', { class: 'pc-st-ringnum' }, el('b', { id: 'pcStChapters', text: '…' }), el('small', { id: 'pcStChaptersOf', text: 'chapters' }))),
    note('pc-st-n-chapters n-yellow', label('assets/icons/chapters.png', 'Chapters Read'), sub('pcStChaptersSub', 'Finished chapters')),
    note('pc-st-n-theories n-sage', label('assets/icons/theories.png', 'Theories Written'),
      el('b', { class: 'pc-st-num', id: 'pcStTheories', text: '…' }), sub('pcStTheoriesSub', 'Posted to the camp')),
    note('pc-st-n-streak n-peach', label('', 'Highest Streak'),
      el('div', { class: 'pc-st-streakrow' },
        el('img', { class: 'pc-st-owl', src: A + 'owl.webp', alt: '', 'aria-hidden': 'true', draggable: 'false' }),
        el('div', {}, el('div', { class: 'pc-st-line' }, el('b', { class: 'pc-st-num', id: 'pcStBest', text: '…' }), el('span', { class: 'pc-st-unit', id: 'pcStBestUnit', text: 'days' })),
          sub('pcStBestSub')))),
    note('pc-st-n-arcade n-yellow', label('assets/arcade/amber-coin.png', 'Arcade Record'),
      el('span', { class: 'pc-st-game', text: 'Amber Gacha Machine' }),
      el('div', { class: 'pc-st-line' }, el('b', { class: 'pc-st-num', id: 'pcStWon', text: '…' }), el('span', { class: 'pc-st-unit', text: 'Amber won' })),
      el('div', { class: 'pc-st-kvs' }, kv('Rank', 'pcStPos'), kv('Jackpots', 'pcStJack')))
  );

  const $ = (id) => stage.querySelector('#' + id);
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (n) => Number(n).toLocaleString('en-US');
  const countUp = (node, to) => {
    if (to == null) { node.textContent = '—'; return; }
    if (reduceMotion() || to === 0) { node.textContent = fmt(to); return; }
    const t0 = performance.now(), dur = 800;
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      node.textContent = fmt(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1 && node.isConnected) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const RING = 804.25;
  const setRing = (pct) => { $('pcStRing').style.strokeDashoffset = String(RING * (1 - pct / 100)); stage.querySelector('.pc-st-ring').setAttribute('aria-label', Math.round(pct) + '% of published chapters read'); };

  let statsLoaded = false;
  async function loadStats() {
    if (statsLoaded) return; statsLoaded = true;
    const [{ getCampStats }, streakMod] = await Promise.all([import('./stats.js?v=1'), import('./streak.js?v=2')]);
    const longest = await streakMod.getLongestStreak().catch(() => null);
    const d = await getCampStats({ userId: user?.id, streak, longestStreak: longest });

    countUp($('pcStChapters'), d.chapters.read);
    if (d.chapters.read != null && d.chapters.total) {
      const pct = Math.min(100, d.chapters.read / d.chapters.total * 100);
      requestAnimationFrame(() => setRing(pct));
      $('pcStChaptersOf').textContent = 'of ' + fmt(d.chapters.total);
      $('pcStChaptersSub').textContent = Math.round(pct) + '% of the published library';
    } else { $('pcStChaptersOf').textContent = 'chapters'; $('pcStChaptersSub').textContent = d.chapters.read == null ? 'Not available right now' : 'Finished chapters'; }
    countUp($('pcStTheories'), d.theories);
    if (d.theories == null) $('pcStTheoriesSub').textContent = 'Not available right now';

    countUp($('pcStBest'), d.longestStreak);
    $('pcStBestUnit').textContent = d.longestStreak === 1 ? 'day' : 'days';
    $('pcStBestSub').textContent = d.longestStreak == null ? 'Not available right now'
      : d.streak != null ? 'Now: ' + d.streak + (d.streak === 1 ? ' day' : ' days') : 'Your best run so far';

    countUp($('pcStWon'), d.arcade ? d.arcade.totalWon : null);
    $('pcStPos').textContent = d.arcade?.pos ? '#' + d.arcade.pos : '—';
    $('pcStJack').textContent = d.arcade ? fmt(d.arcade.jackpots) : '—';
  }

  function setView(view) {
    const stats = view === 'stats';
    stage.classList.toggle('pc-view-stats', stats);
    const [t1, t2] = [stage.querySelector('.pc-tab-1'), stage.querySelector('.pc-tab-2')];
    (stats ? t2 : t1).setAttribute('aria-current', 'page');
    (stats ? t1 : t2).removeAttribute('aria-current');
    if (stats) loadStats();
  }

  const dialog = el('dialog', { class: 'pc-dialog', 'aria-labelledby': 'pcTitle' }, el('div', { class: 'pc-wrap' }, stage));
  document.body.append(dialog);
  opener?.setAttribute('aria-expanded', 'true');

  let closing = false;
  const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const close = () => {
    if (closing) return; closing = true;
    dialog.classList.add('pc-leaving');
    const done = () => {
      dialog.close(); dialog.remove();
      opener?.setAttribute('aria-expanded', 'false');
      if (opener && opener.isConnected) opener.focus();
    };
    if (reduce()) done(); else setTimeout(done, 220);
  };
  closeBtn.addEventListener('click', close);
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
  stage.querySelectorAll('a[href]:not([href="#"])').forEach((a) => a.addEventListener('click', () => { closing = true; }));
  stage.querySelector('#pcSignOut').addEventListener('click', async (e) => {
    const b = e.currentTarget; const label = b.querySelector('span');
    b.disabled = true; label.textContent = 'Signing out…';
    try { await onSignOut?.(); } catch { b.disabled = false; label.textContent = 'Sign Out'; }
  });

  dialog.showModal();
  closeBtn.focus();

  // live Amber balance: fills every [data-amber-balance], including this card
  import('./wallet.js?v=3').then((w) => w.refreshWallet()).catch(() => { amber.textContent = '—'; });
}
