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
    const link = el('link', { rel: 'stylesheet', href: 'css/profile-card.css?v=12' });
    link.addEventListener('load', resolve); link.addEventListener('error', resolve);
    document.head.append(link);
  });
  return cssReady;
}

const img = (name, cls, extra = {}) => el('img', { class: 'pc-i ' + cls, src: A + name + '.webp', alt: '', 'aria-hidden': 'true', draggable: 'false', ...extra });
// Night Owl appears on the card only once the reader has a reading streak of at least this many days.
export const NIGHT_OWL_MIN_STREAK = 3;

// streak: current reading streak in days (number), or null while the streak system is not connected (row and owl stay hidden).
export async function openProfileCard({ profile, user, isAuthor, streak = null, rank = null, opener, onSignOut }) {
  if (document.querySelector('dialog.pc-dialog')) return;
  await ensureStyles();

  const nick = (profile?.nickname || 'Camper').trim();
  const initial = nick.charAt(0).toUpperCase();
  const joined = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-GB') : '—';
  const campId = (user?.id || '').replace(/-/g, '').slice(0, 7).toUpperCase() || '—';
  const bio = (profile?.bio || '').trim();
  const hasStreak = Number.isFinite(streak) && streak >= 0;
  const nightOwl = hasStreak && streak >= NIGHT_OWL_MIN_STREAK;

  // EXP bar fills from the current tier's threshold to the next one; the top tier shows full.
  const rankPct = !rank ? 0 : rank.next_min == null ? 100 : Math.max(0, Math.min(100, (rank.exp - rank.tier_min) / (rank.next_min - rank.tier_min) * 100));
  const rankText = !rank ? '' : rank.next_min == null ? rank.exp.toLocaleString('en-US') + ' EXP · MAX' : rank.exp.toLocaleString('en-US') + ' / ' + rank.next_min.toLocaleString('en-US') + ' EXP';

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

  // ---- inline editing: nickname pencil and Change (avatar) save right here, no trip to the settings page ----
  const me = { nickname: profile?.nickname || '', bio: profile?.bio || '', avatar_url: profile?.avatar_url || null };
  const MAX_AVATAR = 1.5 * 1024 * 1024;
  const msg = el('div', { class: 'pc-i pc-msg', role: 'status', 'aria-live': 'polite' });
  let msgTimer = null;
  const say = (text, bad = true) => { msg.textContent = text; msg.classList.toggle('is-ok', !bad); clearTimeout(msgTimer); if (text) msgTimer = setTimeout(() => { msg.textContent = ''; }, 3500); };
  async function saveProfile(patch) {
    const { updateReaderProfile } = await import('./auth.js');
    const updated = await updateReaderProfile(user.id, { ...me, ...patch });
    me.nickname = updated.nickname; me.bio = updated.bio || ''; me.avatar_url = updated.avatar_url || null;
    if (profile) { profile.nickname = me.nickname; profile.avatar_url = me.avatar_url; }
    return updated;
  }

  const ring = el('div', { class: 'pc-i pc-ring' });
  const paintRing = () => ring.replaceChildren(me.avatar_url ? el('img', { src: me.avatar_url, alt: '', draggable: 'false' }) : el('span', { text: (me.nickname.trim().charAt(0) || '?').toUpperCase() }));
  paintRing();
  const fileInput = el('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif', hidden: '', tabindex: '-1' });
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0]; fileInput.value = '';
    if (!file) return;
    if (file.size > MAX_AVATAR) { say('Picture too large. Max 1.5 MB.'); return; }
    const reader = new FileReader();
    reader.onerror = () => say('Could not read that image.');
    reader.onload = async () => {
      say('Saving picture…', false);
      try { await saveProfile({ avatar_url: String(reader.result) }); paintRing(); say('Picture updated!', false); }
      catch (error) { console.error(error); say(error.message || 'Could not save the picture.'); }
    };
    reader.readAsDataURL(file);
  });

  const nickSpan = el('span', { text: nick });
  const nickPencil = el('button', { class: 'pc-pencil', type: 'button', 'aria-label': 'Edit nickname', title: 'Edit nickname' }, el('img', { src: A + 'edit.webp', alt: '', 'aria-hidden': 'true', draggable: 'false' }));
  let nickInput = null;
  const endNickEdit = () => { if (!nickInput) return; nickInput.replaceWith(nickSpan); nickInput = null; nickPencil.classList.remove('is-save'); nickPencil.setAttribute('aria-label', 'Edit nickname'); nickPencil.title = 'Edit nickname'; nickPencil.disabled = false; };
  async function commitNick() {
    const value = nickInput.value.trim();
    if (value === me.nickname) { endNickEdit(); return; }
    if (value.length < 3) { say('Nickname needs at least 3 characters.'); nickInput.focus(); return; }
    nickInput.disabled = true; nickPencil.disabled = true; say('Saving…', false);
    try { await saveProfile({ nickname: value }); nickSpan.textContent = me.nickname; endNickEdit(); if (!me.avatar_url) paintRing(); say('Nickname updated!', false); }
    catch (error) { console.error(error); nickInput.disabled = false; nickPencil.disabled = false; nickInput.focus(); say(error.message || 'Could not save the nickname.'); }
  }
  nickPencil.addEventListener('click', () => {
    if (nickInput) { commitNick(); return; }
    nickInput = el('input', { class: 'pc-nick-input', type: 'text', maxlength: '30', value: me.nickname, 'aria-label': 'Camp nickname', autocomplete: 'off' });
    nickInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); commitNick(); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); endNickEdit(); say(''); }
    });
    nickSpan.replaceWith(nickInput);
    nickPencil.classList.add('is-save'); nickPencil.setAttribute('aria-label', 'Save nickname'); nickPencil.title = 'Save nickname';
    nickInput.focus(); nickInput.select();
  });

  // reader bio: same inline pattern as the nickname (pencil toggles an editor in place; Ctrl+Enter or the pencil saves, Esc cancels)
  const bioText = el('p', { class: me.bio ? '' : 'is-empty', text: me.bio || 'This camper wrote nothing.' });
  const paintBio = () => { bioText.className = me.bio ? '' : 'is-empty'; bioText.textContent = me.bio || 'This camper wrote nothing.'; };
  const bioPencil = el('button', { class: 'pc-pencil', type: 'button', 'aria-label': 'Edit reader bio', title: 'Edit reader bio' }, el('img', { src: A + 'edit.webp', alt: '', 'aria-hidden': 'true', draggable: 'false' }));
  let bioArea = null;
  const endBioEdit = () => { if (!bioArea) return; bioArea.replaceWith(bioText); bioArea = null; bioPencil.classList.remove('is-save'); bioPencil.setAttribute('aria-label', 'Edit reader bio'); bioPencil.title = 'Edit reader bio'; bioPencil.disabled = false; };
  async function commitBio() {
    const value = bioArea.value.trim();
    if (value === me.bio) { endBioEdit(); return; }
    bioArea.disabled = true; bioPencil.disabled = true; say('Saving…', false);
    try { await saveProfile({ bio: value }); paintBio(); endBioEdit(); say('Bio updated!', false); }
    catch (error) { console.error(error); bioArea.disabled = false; bioPencil.disabled = false; bioArea.focus(); say(error.message || 'Could not save the bio.'); }
  }
  bioPencil.addEventListener('click', () => {
    if (bioArea) { commitBio(); return; }
    bioArea = el('textarea', { class: 'pc-bio-input', maxlength: '300', 'aria-label': 'Reader bio', placeholder: 'Tell the camp a little about yourself…' });
    bioArea.value = me.bio;
    bioArea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); commitBio(); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); endBioEdit(); say(''); }
    });
    bioText.replaceWith(bioArea);
    bioPencil.classList.add('is-save'); bioPencil.setAttribute('aria-label', 'Save reader bio'); bioPencil.title = 'Save reader bio';
    bioArea.focus(); bioArea.setSelectionRange(bioArea.value.length, bioArea.value.length);
  });

  // rank name shrinks with its length so "Camp Rank: [name]" always stays on one line
  const rkSize = !rank ? 28 : rank.name.length <= 8 ? 28 : rank.name.length <= 12 ? 26 : rank.name.length <= 15 ? 23 : 20;

  const stage = el('div', { class: 'pc-stage' + (hasStreak ? ' pc-has-streak' : '') },
    el('h2', { class: 'pc-sr', id: 'pcTitle', text: 'Camp Profile' }),
    img('title', 'pc-title'),
    img('stats-book', 'pc-book'),
    img('stats-title', 'pc-st pc-st-titleimg'),

    el('nav', { 'aria-label': 'Profile sections' },
      tab('pc-tab-1', 'tab-profile', 'Profile', { href: '#', 'aria-current': 'page', onclick: (e) => { e.preventDefault(); setView('profile'); } }),
      tab('pc-tab-2', 'tab-stats', 'Statistics', { onclick: () => setView('stats') }),
      tab('pc-tab-3', 'tab-settings', 'Settings', { href: SETTINGS })),

    // left page: the camper's own info (the right page is still free)
    img('rank-hex', 'pc-hex'),
    rank && el('div', { class: 'pc-i pc-hexlv', text: 'LV ' + rank.tier }),
    nightOwl && img('owl', 'pc-owl'),
    nightOwl && el('div', { class: 'pc-i pc-owlstreak', title: 'Reading streak', text: 'DAY ' + streak }),

    ring,
    plank('pc-btn-chg', 'btn-orange', 'Change', { title: 'Change profile picture', onclick: () => fileInput.click() }),
    fileInput,
    msg,
    el('div', { class: 'pc-i pc-nick' }, nickSpan, nickPencil),
    el('div', { class: 'pc-i pc-bar', role: 'img', 'aria-label': rank ? 'Camp rank progress: ' + rankText : 'Camp rank progress: not available yet' },
      el('i', { style: 'width:' + rankPct + '%' }), rank && el('span', { text: rankText })),
    el('div', { class: 'pc-i pc-campid', text: 'Camp ID: ' + campId }),
    el('div', { class: 'pc-i pc-rankrow', style: '--rk:' + rkSize }, el('span', { text: 'Camp Rank:' }), el('b', { class: 'pc-rankname', title: rank ? rank.name : '', text: rank ? rank.name : 'Soon' })),
    rows.map(([label, value], i) => row(i, label, value)),
    el('section', { class: 'pc-i pc-manifesto', 'aria-labelledby': 'pcBioTitle' },
      el('header', {}, el('h3', { id: 'pcBioTitle', text: 'Reader Bio' }), bioPencil),
      bioText),

    // right page: badges for now
    el('div', { class: 'pc-i pc-badges-title', text: 'Badges' }),
    el('div', { class: 'pc-slots', role: 'group', 'aria-label': 'Badge slots (empty)' },
      [0, 1, 2].map(slot)),

    closeBtn,

    // action planks (inside the left page on Profile, under the book on Statistik)
    plank('pc-btn-1', 'btn-orange', 'Full Profile', { href: FULL_PROFILE }),
    plank('pc-btn-3', 'btn-teal', 'Vault', { disabled: '', title: 'Coming soon' }),
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
