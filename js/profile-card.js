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
    const link = el('link', { rel: 'stylesheet', href: 'css/profile-card.css?v=3' });
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

    el('nav', { 'aria-label': 'Profile sections' },
      tab('pc-tab-1', 'tab-profile', 'Profile', { href: '#', 'aria-current': 'page', onclick: (e) => e.preventDefault() }),
      tab('pc-tab-2', 'tab-stats', 'Statistik', { disabled: '', title: 'Coming soon' }),
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
