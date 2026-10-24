// HOLLOW NIGHT CAMP — Sheet Page Number (PRD §13.2, Step B). Automatic pagination.
// Sheets are cut from the TEXT only (paragraph boundaries + a character budget), never from screen size, so the same
// chapter always gives the same sheet numbers on every device. Editing the text can shift sheets; resume maps a saved
// percent to the nearest valid sheet, so a changed chapter never breaks the reader.

import { el } from './dom.js?v=2';

const TARGET = 1800;         // characters per sheet (soft)
const MAX = TARGET * 1.2;    // a sheet may stretch this far to keep a paragraph whole
const MIN_TAIL = 700;        // a shorter last sheet is merged into the one before it
const NS = 'http://www.w3.org/2000/svg';
const pad = (n) => String(n).padStart(2, '0');

export function splitSheets(text) {
  const paras = (text || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const sheets = [];
  let cur = [], size = 0;
  for (const p of paras) {
    if (cur.length && (size >= TARGET || size + p.length > MAX)) { sheets.push({ paras: cur, size }); cur = []; size = 0; }
    cur.push(p); size += p.length;
  }
  if (cur.length) sheets.push({ paras: cur, size });
  if (sheets.length > 1 && sheets[sheets.length - 1].size < MIN_TAIL) {
    const tail = sheets.pop(), prev = sheets[sheets.length - 1];
    prev.paras.push(...tail.paras); prev.size += tail.size;
  }
  return sheets;
}

// d20 with the sheet number written inside it. Decorative: the number is also given as text (aria-label / sr-only).
export function d20Icon(n) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 32 32'); s.setAttribute('class', 'd20-icon'); s.setAttribute('aria-hidden', 'true');
  s.innerHTML = '<path d="M16 2 28 9v14l-12 7-12-7V9z" class="d20-body" stroke-width="1.8" stroke-linejoin="round"/>'
    + '<path d="M16 2 4 23h24zM4 9l12 7 12-7M16 16v14" class="d20-edges" fill="none" stroke-width="1" stroke-linejoin="round"/>'
    + '<circle cx="16" cy="17.5" r="7.2" class="d20-disc"/><text x="16" y="17.8" text-anchor="middle" dominant-baseline="central" class="d20-num"></text>';
  if (n != null) s.querySelector('text').textContent = pad(n);
  return s;
}
export const setD20 = (svg, n) => { svg.querySelector('text').textContent = pad(n); };

// Fills `container` with sheets. One sheet = continuous reading (no separators, no marker).
export function renderSheets(container, text) {
  const sheets = splitSheets(text);
  const count = sheets.length, total = sheets.reduce((a, s) => a + s.size, 0) || 1;
  const nodes = [];
  const kids = [];
  sheets.forEach((sheet, i) => {
    const n = i + 1;
    if (count > 1 && n > 1) {
      kids.push(el('div', { class: 'sheet-break', role: 'separator', 'aria-label': `Sheet ${n} of ${count}` },
        el('span', { class: 'sheet-break-tag', 'aria-hidden': 'true' }, d20Icon(n))));
    }
    const node = el('section', { class: 'sheet', 'data-sheet': String(n) }, ...sheet.paras.map((p) => el('p', { text: p })));
    nodes.push(node); kids.push(node);
  });
  container.replaceChildren(...kids);

  const api = {
    count, nodes,
    // sheet that holds a given percent of the chapter text (1-based); always valid
    sheetFor(percent) {
      const at = (Math.min(100, Math.max(0, percent)) / 100) * total;
      let acc = 0;
      for (let i = 0; i < count; i++) { acc += sheets[i].size; if (at <= acc) return i + 1; }
      return count;
    },
    scrollTo(n) {
      const node = nodes[Math.min(count, Math.max(1, n)) - 1];
      if (node) window.scrollTo({ top: Math.max(0, window.scrollY + node.getBoundingClientRect().top - 90), behavior: 'auto' });
    },
    current() {
      let n = 1;
      nodes.forEach((node, i) => { if (node.getBoundingClientRect().top <= window.innerHeight * 0.4) n = i + 1; });
      return n;
    }
  };
  if (count > 1) mountPill(container, api);
  return api;
}

// Floating "d20 03 / 12" marker, with real text for screen readers.
function mountPill(container, api) {
  const icon = d20Icon(), tot = el('span');
  const pill = el('div', { class: 'sheet-pill', role: 'status', 'aria-live': 'off' },
    icon, tot, el('span', { class: 'sr-only' }));
  document.body.append(pill);
  let last = 0, raf = 0;
  const paint = () => {
    raf = 0;
    const r = container.getBoundingClientRect();
    pill.hidden = r.bottom < 0 || r.top > window.innerHeight;
    const n = api.current();
    if (n === last) return;
    last = n; setD20(icon, n); tot.textContent = '/ ' + pad(api.count);
    pill.setAttribute('aria-label', `Sheet ${n} of ${api.count}`);
    pill.lastChild.textContent = `Sheet ${n} of ${api.count}`;
  };
  const tick = () => { if (!raf) raf = requestAnimationFrame(paint); };
  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', tick);
  paint();
}
