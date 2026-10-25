// HOLLOW NIGHT CAMP — bookmarks + reading progress (tables: bookmarks, reading_progress; see supabase/bookmarks-history.sql).
// Used by read.html (tools + tracking) and novel.html (Continue reading). Every call degrades quietly:
// if the tables are missing or a request fails, reading still works, there is just no bookmark / resume.

import { supabase } from '../config/supabase.js';
import { el } from './dom.js?v=2';
import { logReadingDay } from './streak.js?v=3';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

async function loadState(chapterId) {
  const [progress, mark] = await Promise.all([
    supabase.from('reading_progress').select('progress').eq('chapter_id', chapterId).maybeSingle(),
    supabase.from('bookmarks').select('id').eq('chapter_id', chapterId).maybeSingle()
  ]);
  if (progress.error || mark.error) return null;
  return { progress: progress.data?.progress ?? null, bookmarked: Boolean(mark.data) };
}

function saveProgress({ userId, chapter, progress }) {
  return supabase.from('reading_progress').upsert({
    user_id: userId, chapter_id: chapter.id, novel_id: chapter.novel_id,
    progress, updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,chapter_id' });
}

// Bookmark button, "Resume" button and scroll tracking for one published chapter.
export async function mountReadingTools({ chapter, userId, body, tools, resume, sheets }) {
  const state = await loadState(chapter.id);
  if (!state) return;

  tools.hidden = false;

  // ---- bookmark ----
  let marked = state.bookmarked;
  const bookmarkButton = el('button', { class: 'hn-btn ghost small', type: 'button' });
  const paintBookmark = () => {
    bookmarkButton.textContent = marked ? '★ Bookmarked' : '☆ Bookmark';
    bookmarkButton.setAttribute('aria-pressed', String(marked));
  };
  paintBookmark();
  bookmarkButton.addEventListener('click', async () => {
    bookmarkButton.disabled = true;
    const { error } = marked
      ? await supabase.from('bookmarks').delete().eq('chapter_id', chapter.id)
      : await supabase.from('bookmarks').insert({ user_id: userId, chapter_id: chapter.id, novel_id: chapter.novel_id });
    bookmarkButton.disabled = false;
    if (error && error.code !== '23505') { window.alert('Could not update the bookmark: ' + error.message); return; }
    marked = !marked;
    paintBookmark();
  });
  tools.append(bookmarkButton);

  // ---- resume ----
  const scrollToProgress = (percent) => {
    const rect = body.getBoundingClientRect();
    const top = window.scrollY + rect.top + rect.height * (percent / 100) - window.innerHeight * 0.6;
    window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
  };
  const saved = state.progress;
  // With sheets (js/sheets.js) resume lands on the start of the sheet that holds the saved percent: stable on every screen.
  const paged = sheets && sheets.count > 1;
  const goTo = (percent) => (paged ? sheets.scrollTo(sheets.sheetFor(percent)) : scrollToProgress(percent));
  if (saved != null && saved > 0 && saved < 100) {
    if (resume) {
      requestAnimationFrame(() => goTo(saved));
      window.addEventListener('load', () => goTo(saved), { once: true });
    } else if (saved >= 3) {
      const where = paged ? 'Sheet ' + String(sheets.sheetFor(saved)).padStart(2, '0') + ' · ' + saved + '%' : saved + '%';
      tools.append(el('button', { class: 'hn-btn ghost small', type: 'button', text: 'Resume from ' + where, onclick: () => goTo(saved) }));
    }
  }

  // ---- progress tracking: percent of the chapter body the bottom of the screen has reached ----
  const current = () => {
    const rect = body.getBoundingClientRect();
    return clamp(Math.round((window.innerHeight - rect.top) / (rect.height || 1) * 100), 0, 100);
  };
  let last = saved ?? 0;
  let timer = null;
  const flush = async () => {
    clearTimeout(timer);
    const now = current();
    if (Math.abs(now - last) < 2 && !(now === 100 && last !== 100)) return;
    last = now;
    const { error } = await saveProgress({ userId, chapter, progress: now });
    if (error) console.warn('Could not save reading progress:', error.message);
    else logReadingDay();   // scrolling counts as reading today (Reading Streak)
  };

  // opening a chapter puts it in the history (keeps the saved position)
  await saveProgress({ userId, chapter, progress: last });

  window.addEventListener('scroll', () => { clearTimeout(timer); timer = setTimeout(flush, 2500); }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  window.addEventListener('pagehide', flush);
}

// "Continue reading" for a novel page: the most recently read published chapter of that novel.
export async function mountContinueReading(container, novelId) {
  const { data, error } = await supabase
    .from('reading_progress')
    .select('chapter_id, progress, updated_at, chapters(title, chapter_number, status)')
    .eq('novel_id', novelId)
    .order('updated_at', { ascending: false })
    .limit(1);
  const row = data?.[0];
  if (error || !row?.chapters) return;

  const chapter = row.chapters;
  const label = (chapter.chapter_number != null ? 'Chapter ' + chapter.chapter_number + ' · ' : '') + chapter.title;
  container.replaceChildren(
    el('a', { class: 'hn-btn', href: 'read.html?id=' + encodeURIComponent(row.chapter_id) + '&resume=1' },
      'Continue reading'),
    el('span', { class: 'continue-note', text: label + (row.progress > 0 && row.progress < 100 ? ' · ' + row.progress + '%' : '') })
  );
  container.hidden = false;
}
