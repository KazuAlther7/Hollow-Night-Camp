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
    const link = el('link', { rel: 'stylesheet', href: 'css/backpack.css?v=1' });
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

// badges: owned badge list (from the profile card); collectibles: loaded here.
export async function openBackpack({ badges = [], opener = null } = {}) {
  await ensureStyles();
  let collectibles = [];
  try { collectibles = await (await import('./collectibles.js?v=1')).getCollectibles(); } catch { collectibles = []; }

  const items = [
    ...badges.map((b) => ({ ...b, cat: 'badges' })),
    ...collectibles.map((c) => ({ ...c, cat: c.category }))
  ];
  const state = { tab: 'all', page: 0, selected: null };
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
  function paintPreview() {
    const it = state.selected;
    pvIcon.replaceChildren(); pvInfo.replaceChildren();
    pvIcon.classList.remove('is-pop'); void pvIcon.offsetWidth;
    if (!it) {
      pvIcon.append(el('div', { class: 'bp-pv-ghost', text: '?' }));
      pvInfo.append(el('p', { text: 'Pick an item from your backpack to see it here.' }));
      pvName.textContent = 'Camp Gear';
      return;
    }
    pvIcon.append(icon(it, 'bp-pv-art')); pvIcon.classList.add('is-pop');
    pvInfo.append(el('small', { class: 'bp-pv-cat', text: CATEGORY_LABEL[it.cat] || 'Item' }), el('p', { text: it.description || 'A keepsake from the camp.' }));
    pvName.textContent = it.title;
  }

  // ---- tabs ----
  const tabEls = TABS.map((t, n) => {
    const b = el('button', { class: 'bp-tab bp-tab-' + n, type: 'button', 'aria-label': t.label, title: t.label, onclick: () => { state.tab = t.id; state.page = 0; paint(true); } }, sprite(t.sprite, 'bp-bg'));
    return b;
  });

  // ---- grid + pager ----
  const grid = el('div', { class: 'bp-grid', role: 'list' });
  const pageText = el('span', { class: 'bp-page-text' });
  const prev = el('button', { class: 'bp-nav bp-prev', type: 'button', 'aria-label': 'Previous page', onclick: () => { if (state.page > 0) { state.page--; paint(true); } } }, sprite('prev', 'bp-bg'));
  const next = el('button', { class: 'bp-nav bp-next', type: 'button', 'aria-label': 'Next page', onclick: () => { if (state.page < pages() - 1) { state.page++; paint(true); } } }, sprite('next', 'bp-bg'));
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
            onclick: () => { state.selected = it; grid.querySelectorAll('.is-sel').forEach((x) => x.classList.remove('is-sel')); cell.classList.add('is-sel'); paintPreview(); } }, sprite('slot', 'bp-bg'), icon(it, 'bp-item'))
        : el('div', { class: 'bp-slot', role: 'listitem', 'aria-hidden': 'true' }, sprite('slot', 'bp-bg'));
      grid.append(cell);
    }
    empty.textContent = list.length ? '' : TABS.find((t) => t.id === state.tab).empty;
    pageText.textContent = 'PAGE ' + (state.page + 1) + ' / ' + pages();
    prev.disabled = state.page === 0; next.disabled = state.page >= pages() - 1;
  }

  const close = el('button', { class: 'bp-close', type: 'button', 'aria-label': 'Close backpack', onclick: () => dlg.close() }, sprite('close', 'bp-bg'));
  box.append(preview, ...tabEls, grid, empty, prev, pager, next, close);
  dlg.append(box);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => { dlg.remove(); opener?.focus?.(); });

  paintPreview(); paint(false);
  document.body.append(dlg);
  dlg.showModal();
  close.focus();
}
