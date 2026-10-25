// HOLLOW NIGHT CAMP — Backpack (was Vault). Opens from the profile card. Tabs: Outfit / Badges / Toys / All, 4x4 grid, paged.
// Left page = preview of the selected item (big icon, info, name plank). Badges come from badges.js, the rest from collectibles.js.

import { el } from './dom.js?v=2';

const A = 'assets/backpack/';
const PER_PAGE = 16;
const TABS = [
  { id: 'outfit', label: 'Outfit', sprite: 'tab-outfit', empty: 'No outfits yet.' },
  { id: 'badges', label: 'Badges', sprite: 'tab-badges', empty: 'No badges yet. Keep reading around the campfire.' },
  { id: 'toys', label: 'Toys', sprite: 'tab-toys', empty: 'No toys yet.' },
  { id: 'all', label: 'All', sprite: 'tab-all', empty: 'Your backpack is empty.' }
];
const CATEGORY_LABEL = { outfit: 'Outfit', badges: 'Badge', toys: 'Toy' };

let cssReady = null;
function ensureStyles() {
  if (cssReady) return cssReady;
  cssReady = new Promise((resolve) => {
    const link = el('link', { rel: 'stylesheet', href: 'css/backpack.css?v=2' });
    link.addEventListener('load', resolve); link.addEventListener('error', resolve);
    document.head.append(link);
  });
  return cssReady;
}

const sprite = (name, cls) => el('img', { class: cls, src: A + name + '.webp', alt: '', 'aria-hidden': 'true', draggable: 'false' });

// Item icon: art if present, otherwise a text pill (never a broken image).
function icon(item, cls) {
  const box = el('div', { class: cls });
  const pill = () => el('span', { class: 'bp-pill', text: item.title });
  if (item.asset_path) {
    const im = el('img', { src: item.asset_path, alt: item.title, draggable: 'false' });
    im.addEventListener('error', () => im.replaceWith(pill()));
    box.append(im);
  } else box.append(pill());
  return box;
}

// ---- sfx: WebAudio synth, no files (same approach as js/arcade-slot.js) ----
let actx = null;
function ctx() {
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); return actx; } catch { return null; }
}
function tone(c, t, f, dur, vol, type = 'sine', f2 = f) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + .02);
}
function noise(c, t, dur, vol, freq) {
  const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(); s.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = .8;
  const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * .25); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f).connect(g).connect(c.destination); s.start(t);
}
const sfx = {
  // canvas thump + rustle, zipper ticks running up, buckle clink
  open() {
    const c = ctx(); if (!c) return; const t = c.currentTime + .02;
    tone(c, t, 120, .18, .5, 'sine', 55);
    noise(c, t + .02, .32, .35, 1800);
    for (let i = 0; i < 9; i++) tone(c, t + .14 + i * .028, 900 + i * 140, .02, .09, 'square');
    tone(c, t + .42, 2100, .22, .12, 'triangle', 1900); tone(c, t + .47, 3150, .3, .08, 'triangle', 2900);
  },
  tab() { const c = ctx(); if (!c) return; const t = c.currentTime; noise(c, t, .09, .18, 2400); tone(c, t, 520, .06, .08, 'triangle', 380); },
  pick() { const c = ctx(); if (!c) return; tone(c, c.currentTime, 760, .07, .07, 'triangle', 900); },
  use() { const c = ctx(); if (!c) return; const t = c.currentTime; tone(c, t, 660, .16, .12, 'triangle'); tone(c, t + .09, 990, .22, .12, 'triangle'); tone(c, t + .18, 1320, .35, .1, 'sine'); noise(c, t, .12, .12, 3200); }
};

// badges: owned badge list; slots: the 3 pinned badges; slot: slot that opened it (or null);
// onUse(item, slot) -> null on success or an error message. Collectibles are loaded here.
export async function openBackpack({ badges = [], slots = [null, null, null], slot = null, onUse = null, opener = null } = {}) {
  sfx.open();
  await ensureStyles();
  let collectibles = [];
  try { collectibles = await (await import('./collectibles.js?v=1')).getCollectibles(); } catch { collectibles = []; }

  const items = [
    ...badges.map((b) => ({ ...b, cat: 'badges', useable: true })),
    ...collectibles.map((c) => ({ ...c, cat: c.category }))
  ];
  const state = { tab: slot !== null ? 'badges' : 'all', page: 0, selected: slot !== null && slots[slot] ? items.find((i) => i.cat === 'badges' && i.key === slots[slot].key) || null : null };
  const inTab = () => items.filter((i) => state.tab === 'all' || i.cat === state.tab);
  const pages = () => Math.max(1, Math.ceil(inTab().length / PER_PAGE));

  const dlg = el('dialog', { class: 'bp', 'aria-label': 'Backpack' });
  const box = el('div', { class: 'bp-box' });
  box.append(sprite('frame', 'bp-frame'));

  // ---- preview page (left) ----
  const pvIcon = el('div', { class: 'bp-pv-icon' });
  const pvInfo = el('div', { class: 'bp-pv-info' });
  const pvName = el('span', { class: 'bp-pv-name' });
  const preview = el('div', { class: 'bp-preview', 'aria-live': 'polite' },
    el('div', { class: 'bp-pv-title', text: 'PREVIEW' }), pvIcon, pvInfo,
    el('div', { class: 'bp-pv-plank' }, sprite('plank', 'bp-bg'), pvName));
  // Use button under the name plank, only for useable items (badges). Pins the badge to the slot that opened the Backpack.
  const useLabel = el('span', { text: 'USE' });
  const use = el('button', { class: 'bp-use', type: 'button', hidden: '', onclick: async () => {
    const it = state.selected; if (!it || !onUse) return;
    use.disabled = true;
    const err = await onUse(it, slot);
    if (err) { use.disabled = false; pvInfo.replaceChildren(el('p', { class: 'bp-pv-err', text: err })); return; }
    sfx.use(); dlg.close();
  } }, sprite('plank-nailed', 'bp-bg'), useLabel);
  function paintUse() {
    const it = state.selected;
    use.hidden = !(it && it.useable && onUse);
    if (use.hidden) return;
    const equipped = slot !== null ? slots[slot]?.key === it.key : slots.some((b) => b?.key === it.key);
    useLabel.textContent = equipped ? 'EQUIPPED' : 'USE'; use.disabled = equipped;
  }
  function paintPreview() {
    const it = state.selected;
    pvIcon.replaceChildren(); pvInfo.replaceChildren();
    pvIcon.classList.remove('is-pop'); void pvIcon.offsetWidth;
    if (!it) {
      pvIcon.append(el('div', { class: 'bp-pv-ghost', text: '?' }));
      pvInfo.append(el('p', { text: 'Pick an item from your backpack to see it here.' }));
      pvName.textContent = 'Camp Gear';
      paintUse();
      return;
    }
    pvIcon.append(icon(it, 'bp-pv-art')); pvIcon.classList.add('is-pop');
    pvInfo.append(el('small', { class: 'bp-pv-cat', text: CATEGORY_LABEL[it.cat] || 'Item' }), el('p', { text: it.description || 'A keepsake from the camp.' }));
    pvName.textContent = it.title;
    paintUse();
  }

  // ---- tabs ----
  const tabEls = TABS.map((t, n) => {
    const b = el('button', { class: 'bp-tab bp-tab-' + n, type: 'button', 'aria-label': t.label, title: t.label, onclick: () => { if (state.tab !== t.id) sfx.tab(); state.tab = t.id; state.page = 0; paint(true); } }, sprite(t.sprite, 'bp-bg'));
    return b;
  });

  // ---- grid + pager ----
  const grid = el('div', { class: 'bp-grid', role: 'list' });
  const pageText = el('span', { class: 'bp-page-text' });
  const prev = el('button', { class: 'bp-nav bp-prev', type: 'button', 'aria-label': 'Previous page', onclick: () => { if (state.page > 0) { sfx.tab(); state.page--; paint(true); } } }, sprite('prev', 'bp-bg'));
  const next = el('button', { class: 'bp-nav bp-next', type: 'button', 'aria-label': 'Next page', onclick: () => { if (state.page < pages() - 1) { sfx.tab(); state.page++; paint(true); } } }, sprite('next', 'bp-bg'));
  const pager = el('div', { class: 'bp-page' }, sprite('page', 'bp-bg'), pageText);
  const empty = el('p', { class: 'bp-empty' });

  function paint(animate) {
    const list = inTab();
    state.page = Math.min(state.page, pages() - 1);
    tabEls.forEach((b, n) => { const on = TABS[n].id === state.tab; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
    grid.replaceChildren();
    grid.classList.remove('is-flip'); if (animate) { void grid.offsetWidth; grid.classList.add('is-flip'); }
    const slice = list.slice(state.page * PER_PAGE, (state.page + 1) * PER_PAGE);
    for (let n = 0; n < PER_PAGE; n++) {
      const it = slice[n];
      const cell = it
        ? el('button', { class: 'bp-slot has-item' + (state.selected?.key === it.key ? ' is-sel' : ''), type: 'button', role: 'listitem', title: it.title, style: '--n:' + n,
            onclick: () => { sfx.pick(); state.selected = it; grid.querySelectorAll('.is-sel').forEach((x) => x.classList.remove('is-sel')); cell.classList.add('is-sel'); paintPreview(); } }, sprite('slot', 'bp-bg'), icon(it, 'bp-item'))
        : el('div', { class: 'bp-slot', role: 'listitem', 'aria-hidden': 'true' }, sprite('slot', 'bp-bg'));
      grid.append(cell);
    }
    empty.textContent = list.length ? '' : TABS.find((t) => t.id === state.tab).empty;
    pageText.textContent = 'PAGE ' + (state.page + 1) + ' / ' + pages();
    prev.disabled = state.page === 0; next.disabled = state.page >= pages() - 1;
  }

  const close = el('button', { class: 'bp-close', type: 'button', 'aria-label': 'Close backpack', onclick: () => dlg.close() }, sprite('close', 'bp-bg'));
  box.append(preview, use, ...tabEls, grid, empty, prev, pager, next, close);
  dlg.append(box);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => { dlg.remove(); opener?.focus?.(); });

  paintPreview(); paint(false);
  document.body.append(dlg);
  dlg.showModal();
  close.focus();
}
