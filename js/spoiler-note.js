// HOLLOW NIGHT CAMP — World Building spoiler warning (PRD §13.1, Step A).
// Sticky-note popup built on a native <dialog>: showModal() gives the focus trap, inert background and focus restoration.
// Acknowledgement lives in sessionStorage only (one browsing session). This is a courtesy gate, not security:
// chapter-gated lore must be filtered by the database (see sql/worldbuilding_spoiler.sql).

import { el } from './dom.js?v=2';

const KEY = 'hn-spoiler-ack';
const SAFE_PAGE = 'novels.html';

export const hasAcknowledged = () => {
  try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; }
};
const remember = () => { try { sessionStorage.setItem(KEY, '1'); } catch { /* private mode: warn again next page */ } };

function leave() {
  let sameSite = false;
  try { sameSite = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch { /* ignore */ }
  if (sameSite && history.length > 1) history.back();
  else location.href = SAFE_PAGE;
}

// Shows the note. Resolves true when the reader continues. "Take Me Back" navigates away and never resolves.
// mode 'gate': must choose. mode 'reopen': Esc just closes the note.
function openNote(mode) {
  return new Promise((resolve) => {
    const opener = document.activeElement;
    const titleId = 'spoilerNoteTitle';
    const bodyId = 'spoilerNoteBody';

    const go = el('button', { class: 'sn-btn sn-go', type: 'button', text: 'I Understand — Continue' });
    const back = el('button', { class: 'sn-btn sn-back', type: 'button', text: 'Take Me Back' });
    const dialog = el('dialog', { class: 'spoiler-note', 'aria-labelledby': titleId, 'aria-describedby': bodyId },
      el('div', { class: 'sn-paper' },
        el('span', { class: 'sn-pin', 'aria-hidden': 'true' }),
        el('h2', { id: titleId, text: 'A Note Before You Enter' }),
        el('p', { id: bodyId, text: 'The records ahead may reveal secrets, hidden connections, and events from later chapters. Continue only if you’re comfortable with spoilers.' }),
        el('div', { class: 'sn-actions' }, go, back)
      )
    );

    const close = (after) => {
      dialog.classList.add('sn-leaving');
      const done = () => {
        dialog.close();
        dialog.remove();
        if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus();
        after();
      };
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) done(); else setTimeout(done, 200);
    };

    go.addEventListener('click', () => { remember(); close(() => resolve(true)); });
    back.addEventListener('click', () => {
      if (mode === 'reopen') close(() => resolve(false));
      else { dialog.classList.add('sn-leaving'); leave(); }
    });
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      if (mode === 'reopen') close(() => resolve(false));
      else back.click();
    });

    document.body.append(dialog);
    dialog.showModal();
    go.focus();
  });
}

// Call before loading or rendering any World Building content. Skips the popup once acknowledged this session,
// and for Authors (preview / editing must stay usable).
export async function spoilerGate({ isAuthor = false } = {}) {
  if (isAuthor || hasAcknowledged()) return true;
  return openNote('gate');
}

// Small "Spoiler notice" button so the reader can reopen the warning at any time.
export function mountReopen(host) {
  if (!host || host.querySelector('.sn-reopen')) return;
  host.append(el('button', { class: 'sn-reopen', type: 'button', text: 'Spoiler notice', onclick: () => openNote('reopen') }));
}
