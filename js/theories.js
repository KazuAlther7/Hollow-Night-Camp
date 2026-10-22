// HOLLOW NIGHT CAMP — Theories & Mysteries
// theories.html            -> list + category filter + new theory
// theories.html?id=<uuid>  -> theory detail + replies
// Permissions are enforced by RLS (supabase/002_theories.sql); buttons here only mirror them.

import { supabase } from '../config/supabase.js';
import { el, formatDate } from './dom.js?v=2';
import { initPage, trackLoad } from './shared.js?v=18';

const ctx = await initPage({ active: 'theories' });
const root = document.getElementById('theoriesRoot');

const CATEGORIES = { confirmed: 'Confirmed', likely: 'Likely', speculation: 'Speculation', wild: 'Wild Theory' };
const PAGE_SIZE = 12;
const verified = Boolean(ctx.user.email_confirmed_at || ctx.user.confirmed_at);

// ---------- helpers ----------

function friendly(error) {
  const message = error?.message || '';
  if (/Slow down/i.test(message)) return 'Slow down: posting limit reached, try again later.';
  if (error?.code === '42501' || /row-level security/i.test(message)) {
    return verified ? 'You are not allowed to do that.' : 'Verify your email before posting.';
  }
  return 'Something went wrong. Try again.';
}

async function loadProfiles(ids) {
  const unique = [...new Set(ids)].filter(Boolean);
  if (!unique.length) return {};
  const { data } = await supabase.from('public_profiles').select('id, nickname, avatar_url').in('id', unique);
  return Object.fromEntries((data || []).map((row) => [row.id, row]));
}

// avatar + nickname, e.g. [photo] Kazu Alther
function person(profiles, id, className = '') {
  const profile = profiles[id] || {};
  const name = profile.nickname || 'Camper';
  const fallback = () => el('span', { class: 'th-avatar th-avatar-fallback', 'aria-hidden': 'true', text: name.trim().charAt(0).toUpperCase() || 'C' });
  let avatar;
  if (profile.avatar_url) {
    avatar = el('img', { class: 'th-avatar', src: profile.avatar_url, alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' });
    avatar.addEventListener('error', () => avatar.replaceWith(fallback()), { once: true });
  } else {
    avatar = fallback();
  }
  return el('span', { class: ('th-person ' + className).trim() }, avatar, el('span', { class: 'th-name', text: name }));
}

function categoryBadge(category) {
  return el('span', { class: 'hn-badge th-badge ' + category, text: CATEGORIES[category] || category });
}

function pinnedBadge(theory) {
  return theory.is_pinned ? el('span', { class: 'hn-badge th-badge pinned', text: 'Pinned' }) : null;
}

function hiddenBadge(status) {
  return status === 'hidden' ? el('span', { class: 'hn-badge th-badge hidden', text: 'Hidden' }) : null;
}

function goTo(search) {
  window.location.href = 'theories.html' + search;
}

async function report(target) {
  const reason = (window.prompt('Why are you reporting this? (3-300 characters)') || '').trim();
  if (!reason) return;
  if (reason.length < 3 || reason.length > 300) {
    window.alert('The reason must be 3-300 characters.');
    return;
  }
  const { error } = await supabase.from('theory_reports').insert({ ...target, reason });
  if (error) {
    window.alert(error.code === '23505' ? 'You already reported this.' : friendly(error));
    return;
  }
  window.alert('Report sent. Thank you.');
}

// ---------- new / edit dialog ----------

function openTheoryDialog({ theory = null, onSaved }) {
  const editing = Boolean(theory);
  const allowed = ctx.isAuthor ? Object.keys(CATEGORIES) : ['likely', 'speculation', 'wild'];
  const current = theory?.category || 'speculation';

  const titleInput = el('input', { type: 'text', maxlength: '120', required: true, value: theory?.title || '' });
  const select = el('select', {}, allowed.map((key) => el('option', { value: key, text: CATEGORIES[key] })));
  select.value = allowed.includes(current) ? current : allowed[0];
  const bodyInput = el('textarea', { class: 'tall', maxlength: '5000', required: true });
  bodyInput.value = theory?.body || '';
  const status = el('p', { class: 'hn-form-status', role: 'status' });
  const saveButton = el('button', { class: 'hn-btn', type: 'submit', text: editing ? 'Save changes' : 'Post theory' });
  const cancelButton = el('button', { class: 'hn-btn ghost', type: 'button', text: 'Cancel' });

  const form = el('form', { class: 'hn-form', novalidate: true },
    el('h2', { text: editing ? 'Edit theory' : 'New theory' }),
    el('label', { class: 'hn-field' }, el('span', { text: 'Title' }), titleInput),
    el('label', { class: 'hn-field' }, el('span', { text: 'Category' }), el('div', { class: 'hn-select' }, select)),
    el('label', { class: 'hn-field' }, el('span', { text: 'Your theory' }), bodyInput),
    status,
    el('div', { class: 'hn-form-actions' }, cancelButton, saveButton)
  );
  const dialog = el('dialog', { class: 'hn-dialog' }, form);
  document.body.append(dialog);
  dialog.showModal();

  const close = () => { dialog.close(); dialog.remove(); };
  cancelButton.addEventListener('click', close);
  dialog.addEventListener('cancel', () => dialog.remove());

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();
    status.className = 'hn-form-status error';
    if (title.length < 3) { status.textContent = 'Title needs at least 3 characters.'; return; }
    if (body.length < 10) { status.textContent = 'Theory needs at least 10 characters.'; return; }

    saveButton.disabled = true;
    status.className = 'hn-form-status';
    status.textContent = 'Saving...';

    const row = { title, body, category: select.value };
    const result = editing
      ? await supabase.from('theories').update(row).eq('id', theory.id).select('id')
      : await supabase.from('theories').insert(row).select('id');

    const saved = result.data?.[0];
    if (result.error || !saved) {
      status.className = 'hn-form-status error';
      status.textContent = result.error ? friendly(result.error) : 'You are not allowed to edit this theory.';
      saveButton.disabled = false;
      return;
    }
    close();
    onSaved(saved.id);
  });
}

// ---------- list ----------

async function renderList() {
  const state = { category: 'all', offset: 0 };

  const head = el('div', { class: 'library-head' },
    el('h1', { text: 'Theories & Mysteries' }),
    el('p', { text: 'Every clue matters. The investigation begins here.' })
  );

  const filters = el('div', { class: 'th-filters', role: 'group', 'aria-label': 'Filter by category' });
  const chips = {};
  [['all', 'All'], ...Object.entries(CATEGORIES)].forEach(([key, label]) => {
    chips[key] = el('button', { class: 'th-chip', type: 'button', 'aria-pressed': String(key === 'all'), text: label });
    chips[key].addEventListener('click', () => {
      state.category = key;
      Object.entries(chips).forEach(([k, chip]) => chip.setAttribute('aria-pressed', String(k === key)));
      load(true);
    });
    filters.append(chips[key]);
  });

  const newButton = el('button', { class: 'hn-btn', type: 'button', text: 'New Theory' });
  newButton.addEventListener('click', () => {
    if (!verified) { window.alert('Verify your email before posting.'); return; }
    openTheoryDialog({ onSaved: (id) => goTo('?id=' + encodeURIComponent(id)) });
  });

  const list = el('div', { class: 'th-list' });
  const status = el('p', { class: 'th-status', role: 'status', hidden: true });
  const moreButton = el('button', { class: 'hn-btn ghost th-more', type: 'button', text: 'Load more', hidden: true });
  moreButton.addEventListener('click', () => load(false));

  root.replaceChildren(head, el('div', { class: 'th-toolbar' }, filters, newButton), list, status, moreButton);

  async function load(reset) {
    if (reset) { state.offset = 0; list.replaceChildren(); }
    status.hidden = true;
    moreButton.hidden = true;
    moreButton.disabled = true;

    let query = supabase
      .from('theories')
      .select('id, title, body, category, status, is_pinned, author_id, created_at, theory_replies(count)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(state.offset, state.offset + PAGE_SIZE - 1);
    if (state.category !== 'all') query = query.eq('category', state.category);

    const { data, error } = await query;
    if (error) {
      status.className = 'th-status error';
      status.textContent = 'Could not load theories. Try again later.';
      status.hidden = false;
      return;
    }

    const profiles = await loadProfiles(data.map((t) => t.author_id));
    data.forEach((theory) => {
      const replies = theory.theory_replies?.[0]?.count ?? 0;
      const excerpt = theory.body.length > 170 ? theory.body.slice(0, 170).trimEnd() + '...' : theory.body;
      list.append(el('a', { class: 'th-card', href: 'theories.html?id=' + encodeURIComponent(theory.id) },
        el('div', { class: 'th-top' }, pinnedBadge(theory), categoryBadge(theory.category), hiddenBadge(theory.status)),
        el('h3', { text: theory.title }),
        el('p', { class: 'th-excerpt', text: excerpt }),
        el('div', { class: 'th-meta' },
          person(profiles, theory.author_id),
          el('span', { text: formatDate(theory.created_at) }),
          el('span', { text: replies + (replies === 1 ? ' reply' : ' replies') })
        )
      ));
    });

    state.offset += data.length;
    if (!list.children.length) {
      list.append(el('div', { class: 'th-empty' },
        el('strong', { text: 'No theories here yet. ' }),
        'Be the first to connect the clues.'
      ));
    }
    moreButton.disabled = false;
    moreButton.hidden = data.length < PAGE_SIZE;
  }

  await trackLoad(load(true), 'Reading the theories');
}

// ---------- detail ----------

async function renderDetail(id) {
  const { data: theory, error } = await supabase
    .from('theories')
    .select('id, title, body, category, status, is_pinned, author_id, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  const back = el('p', { class: 'novel-back' }, el('a', { href: 'theories.html', text: '< All theories' }));

  if (error || !theory) {
    root.replaceChildren(el('div', { class: 'th-detail' }, back,
      el('div', { class: 'th-empty', text: error ? 'Could not load this theory.' : 'This theory does not exist or is no longer available.' })));
    return;
  }

  const { data: replies } = await supabase
    .from('theory_replies')
    .select('id, body, status, author_id, created_at')
    .eq('theory_id', id)
    .order('created_at', { ascending: true });

  const profiles = await loadProfiles([theory.author_id, ...(replies || []).map((r) => r.author_id)]);
  const isOwner = theory.author_id === ctx.user.id;
  const canEdit = ctx.isAuthor || (isOwner && theory.category !== 'confirmed');

  const actions = el('div', { class: 'th-actions' });
  if (canEdit) {
    const editButton = el('button', { class: 'hn-btn ghost small', type: 'button', text: 'Edit' });
    editButton.addEventListener('click', () => openTheoryDialog({ theory, onSaved: () => renderDetail(id) }));
    actions.append(editButton);
  }
  if (ctx.isAuthor) {
    const hideButton = el('button', { class: 'hn-btn ghost small', type: 'button', text: theory.status === 'hidden' ? 'Unhide' : 'Hide' });
    hideButton.addEventListener('click', async () => {
      const { data, error: err } = await supabase.from('theories')
        .update({ status: theory.status === 'hidden' ? 'visible' : 'hidden' }).eq('id', id).select('id');
      if (err || !data?.length) { window.alert(err ? friendly(err) : 'Not allowed.'); return; }
      renderDetail(id);
    });
    actions.append(hideButton);

    const pinButton = el('button', { class: 'hn-btn ghost small', type: 'button', text: theory.is_pinned ? 'Unpin' : 'Pin to top' });
    pinButton.addEventListener('click', async () => {
      pinButton.disabled = true;
      const { data, error: err } = await supabase.from('theories')
        .update({ is_pinned: !theory.is_pinned }).eq('id', id).select('id');
      if (err || !data?.length) { pinButton.disabled = false; window.alert(err ? friendly(err) : 'Not allowed.'); return; }
      renderDetail(id);
    });
    actions.append(pinButton);
  }
  if (isOwner || ctx.isAuthor) {
    const deleteButton = el('button', { class: 'hn-btn danger small', type: 'button', text: 'Delete' });
    deleteButton.addEventListener('click', async () => {
      if (!window.confirm('Delete this theory and all its replies? This cannot be undone.')) return;
      const { data, error: err } = await supabase.from('theories').delete().eq('id', id).select('id');
      if (err || !data?.length) { window.alert(err ? friendly(err) : 'Not allowed.'); return; }
      goTo('');
    });
    actions.append(deleteButton);
  }
  if (!isOwner) {
    const reportButton = el('button', { class: 'hn-btn ghost small', type: 'button', text: 'Report' });
    reportButton.addEventListener('click', () => report({ theory_id: id }));
    actions.append(reportButton);
  }

  const replyList = el('ul', { class: 'th-replies' });
  (replies || []).forEach((reply) => replyList.append(buildReply(reply, profiles, id)));
  if (!replyList.children.length) {
    replyList.append(el('li', { class: 'th-empty', text: 'No replies yet. Add your own clue.' }));
  }

  const textarea = el('textarea', { maxlength: '2000', placeholder: 'Add a reply...', 'aria-label': 'Your reply', disabled: !verified });
  const counter = el('span', { class: 'th-count', text: '0 / 2000' });
  textarea.addEventListener('input', () => { counter.textContent = textarea.value.length + ' / 2000'; });
  const sendButton = el('button', { class: 'hn-btn', type: 'submit', text: 'Reply', disabled: !verified });
  const replyStatus = el('p', { class: 'hn-form-status', role: 'status' });
  const replyForm = el('form', { class: 'th-reply-form', novalidate: true },
    textarea,
    el('div', { class: 'th-reply-foot' }, counter, sendButton),
    replyStatus
  );
  replyForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const body = textarea.value.trim();
    if (!body) return;
    sendButton.disabled = true;
    replyStatus.className = 'hn-form-status';
    replyStatus.textContent = 'Sending...';
    const { error: err } = await supabase.from('theory_replies').insert({ theory_id: id, body });
    if (err) {
      replyStatus.className = 'hn-form-status error';
      replyStatus.textContent = friendly(err);
      sendButton.disabled = false;
      return;
    }
    renderDetail(id);
  });

  root.replaceChildren(el('div', { class: 'th-detail' },
    back,
    el('div', { class: 'th-top' }, pinnedBadge(theory), categoryBadge(theory.category), hiddenBadge(theory.status)),
    el('h1', { text: theory.title }),
    el('div', { class: 'th-meta' },
      person(profiles, theory.author_id, 'lg'),
      el('span', { text: formatDate(theory.created_at) })
    ),
    el('div', { class: 'th-body', text: theory.body }),
    actions,
    el('h2', { class: 'th-replies-head', text: 'Replies' + (replies?.length ? ' (' + replies.length + ')' : '') }),
    replyList,
    replyForm,
    verified ? null : el('p', { class: 'th-note', text: 'Verify your email to reply or post theories.' })
  ));
}

function buildReply(reply, profiles, theoryId) {
  const isOwner = reply.author_id === ctx.user.id;
  const tools = el('div', { class: 'th-reply-tools' });

  if (ctx.isAuthor) {
    const hide = el('button', { class: 'hn-btn ghost small', type: 'button', text: reply.status === 'hidden' ? 'Unhide' : 'Hide' });
    hide.addEventListener('click', async () => {
      const { data, error } = await supabase.from('theory_replies')
        .update({ status: reply.status === 'hidden' ? 'visible' : 'hidden' }).eq('id', reply.id).select('id');
      if (error || !data?.length) { window.alert(error ? friendly(error) : 'Not allowed.'); return; }
      renderDetail(theoryId);
    });
    tools.append(hide);
  }
  if (isOwner || ctx.isAuthor) {
    const del = el('button', { class: 'hn-btn danger small', type: 'button', text: 'Delete' });
    del.addEventListener('click', async () => {
      if (!window.confirm('Delete this reply?')) return;
      const { data, error } = await supabase.from('theory_replies').delete().eq('id', reply.id).select('id');
      if (error || !data?.length) { window.alert(error ? friendly(error) : 'Not allowed.'); return; }
      renderDetail(theoryId);
    });
    tools.append(del);
  }
  if (!isOwner) {
    const rep = el('button', { class: 'hn-btn ghost small', type: 'button', text: 'Report' });
    rep.addEventListener('click', () => report({ reply_id: reply.id }));
    tools.append(rep);
  }

  return el('li', { class: 'th-reply' + (reply.status === 'hidden' ? ' is-hidden' : '') },
    el('div', { class: 'th-meta' },
      person(profiles, reply.author_id),
      el('span', { text: formatDate(reply.created_at) }),
      hiddenBadge(reply.status)
    ),
    el('p', { text: reply.body }),
    tools.children.length ? tools : null
  );
}

// ---------- route ----------

const id = new URLSearchParams(window.location.search).get('id');
if (id) await renderDetail(id);
else await renderList();
