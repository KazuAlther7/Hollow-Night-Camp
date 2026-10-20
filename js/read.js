// HOLLOW NIGHT CAMP — read.html (chapter reader). Drafts are hidden from Readers by RLS.

import { initPage } from './shared.js?v=8';
import { supabase } from '../config/supabase.js';
import { el } from './dom.js?v=2';

await initPage({ active: 'novels' });

const chapterId = new URLSearchParams(window.location.search).get('id');

const novelEl = document.getElementById('readerNovel');
const titleEl = document.getElementById('readerTitle');
const subEl = document.getElementById('readerSub');
const bodyEl = document.getElementById('readerBody');
const navEl = document.getElementById('readerNav');

function fail(message) {
  titleEl.textContent = 'Chapter not found';
  bodyEl.replaceChildren(el('p', { class: 'reader-empty', text: message }));
}

if (!chapterId) {
  fail('No chapter was selected.');
} else {
  const { data: chapter, error } = await supabase.from('chapters').select('*').eq('id', chapterId).maybeSingle();

  if (error || !chapter) {
    fail(error ? error.message : 'It may have been removed or is not published yet.');
  } else {
    document.title = chapter.title + ' — Hollow Night Camp';
    titleEl.textContent = chapter.title;

    // optional chapter cover: shown at the very top; without one the page stays as normal
    if (chapter.cover_url) {
      const cover = document.getElementById('readerCover');
      cover.src = chapter.cover_url;
      cover.alt = 'Cover of ' + chapter.title;
      cover.hidden = false;
    }

    if (chapter.subtitle) {
      subEl.textContent = chapter.subtitle;
      subEl.hidden = false;
    }

    const body = (chapter.body || '').trim();
    bodyEl.replaceChildren(
      ...(body
        ? body.split(/\n{2,}/).map((paragraph) => el('p', { text: paragraph.trim() }))
        : [el('p', { class: 'reader-empty', text: 'This chapter is empty.' })])
    );

    const [{ data: novel }, { data: siblings }] = await Promise.all([
      supabase.from('novels').select('id, title').eq('id', chapter.novel_id).maybeSingle(),
      supabase.from('chapters').select('id, title').eq('novel_id', chapter.novel_id)
        .eq('status', 'published').order('position', { ascending: true }).order('created_at', { ascending: true })
    ]);

    if (novel) {
      novelEl.replaceChildren(el('a', { href: 'novel.html?id=' + encodeURIComponent(novel.id), text: novel.title }));
      novelEl.firstChild.style.color = 'inherit';
    }

    const list = siblings || [];
    const index = list.findIndex((item) => item.id === chapter.id);
    const prev = index > 0 ? list[index - 1] : null;
    const next = index >= 0 && index < list.length - 1 ? list[index + 1] : null;

    navEl.replaceChildren(
      prev ? el('a', { class: 'hn-btn ghost', href: 'read.html?id=' + encodeURIComponent(prev.id) }, el('span', { class: 'icon icon-back', 'aria-hidden': 'true' }), 'Previous') : el('span'),
      novel ? el('a', { class: 'hn-btn ghost', href: 'novel.html?id=' + encodeURIComponent(novel.id), text: 'Chapter list' }) : el('span'),
      next ? el('a', { class: 'hn-btn', href: 'read.html?id=' + encodeURIComponent(next.id) }, 'Next', el('span', { class: 'icon icon-back icon-flip', 'aria-hidden': 'true' })) : el('span')
    );
  }
}
