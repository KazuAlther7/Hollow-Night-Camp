// HOLLOW NIGHT CAMP — Settings > History: continue reading, bookmarks, reading history (all private to the user).

import { supabase } from '../config/supabase.js';
import { el, formatDate } from './dom.js?v=2';

const chapterLabel = (chapter) =>
  chapter ? (chapter.chapter_number != null ? 'Chapter ' + chapter.chapter_number + ' · ' : '') + chapter.title : 'Chapter no longer available';

function row({ chapterId, chapter, novel, meta, progress, resume, action }) {
  const text = el('div', { class: 'hist-text' },
    el('strong', { text: novel?.title || 'Unknown novel' }),
    el('span', { text: chapterLabel(chapter) }),
    meta ? el('small', { text: meta }) : null,
    progress != null ? el('div', { class: 'hist-bar', role: 'img', 'aria-label': progress + '% read' }, el('span', { style: 'width:' + progress + '%' })) : null
  );
  return el('li', { class: 'hist-row' },
    chapter
      ? el('a', { class: 'hist-link', href: 'read.html?id=' + encodeURIComponent(chapterId) + (resume ? '&resume=1' : '') }, text)
      : el('div', { class: 'hist-link' }, text),
    action
  );
}

function block(title, note, content) {
  return el('section', { class: 'hist-block' }, el('h3', { text: title }), note ? el('p', { class: 'hist-note', text: note }) : null, content);
}

export async function mountHistory(root, userId) {
  root.replaceChildren(el('p', { class: 'hist-note', text: 'Loading…' }));

  const select = 'chapter_id, novel_id, chapters(title, chapter_number), novels(title)';
  const [progressRes, marksRes] = await Promise.all([
    supabase.from('reading_progress').select(select + ', progress, updated_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(60),
    supabase.from('bookmarks').select(select + ', created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(100)
  ]);

  if (progressRes.error || marksRes.error) {
    root.replaceChildren(el('p', { class: 'hist-note', text: 'Could not load your history right now. Try again later.' }));
    return;
  }

  const refresh = () => mountHistory(root, userId);
  const history = progressRes.data || [];
  const marks = marksRes.data || [];

  // one entry per novel: the chapter read most recently
  const seen = new Set();
  const latest = history.filter((item) => {
    if (seen.has(item.novel_id) || !item.chapters) return false;
    seen.add(item.novel_id);
    return true;
  }).slice(0, 6);

  const continueList = latest.length
    ? el('ul', { class: 'hist-list' }, ...latest.map((item) => row({
        chapterId: item.chapter_id, chapter: item.chapters, novel: item.novels,
        meta: 'Last read ' + formatDate(item.updated_at), progress: item.progress, resume: true,
        action: el('a', { class: 'hn-btn small', href: 'read.html?id=' + encodeURIComponent(item.chapter_id) + '&resume=1', text: 'Resume' })
      })))
    : el('p', { class: 'hist-empty', text: 'Nothing yet. Open a chapter and it will show up here.' });

  const bookmarkList = marks.length
    ? el('ul', { class: 'hist-list' }, ...marks.map((item) => row({
        chapterId: item.chapter_id, chapter: item.chapters, novel: item.novels,
        meta: 'Saved ' + formatDate(item.created_at),
        action: el('button', {
          class: 'hn-btn danger small', type: 'button', text: 'Remove',
          onclick: async (event) => {
            event.currentTarget.disabled = true;
            const { error } = await supabase.from('bookmarks').delete().eq('user_id', userId).eq('chapter_id', item.chapter_id);
            if (error) { window.alert('Could not remove the bookmark: ' + error.message); event.currentTarget.disabled = false; return; }
            refresh();
          }
        })
      })))
    : el('p', { class: 'hist-empty', text: 'No bookmarks yet. Use “Bookmark” on any chapter page.' });

  const clearButton = el('button', {
    class: 'hn-btn danger small', type: 'button', text: 'Clear reading history', disabled: !history.length,
    onclick: async (event) => {
      if (!window.confirm('Clear your reading history and saved positions? Bookmarks are kept.')) return;
      event.currentTarget.disabled = true;
      const { error } = await supabase.from('reading_progress').delete().eq('user_id', userId);
      if (error) { window.alert('Could not clear the history: ' + error.message); event.currentTarget.disabled = false; return; }
      refresh();
    }
  });

  const historyList = history.length
    ? el('ul', { class: 'hist-list' }, ...history.map((item) => row({
        chapterId: item.chapter_id, chapter: item.chapters, novel: item.novels,
        meta: formatDate(item.updated_at) + (item.progress ? ' · ' + item.progress + '%' : ''), resume: true
      })))
    : el('p', { class: 'hist-empty', text: 'Your reading history is empty.' });

  root.replaceChildren(
    block('Continue reading', 'Pick up where you left off, one chapter per novel.', continueList),
    block('Bookmarks', null, bookmarkList),
    block('Reading history', 'Only you can see this.', el('div', {}, historyList, el('div', { class: 'hist-actions' }, clearButton)))
  );
}
