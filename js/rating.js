// HOLLOW NIGHT CAMP — d20 ratings (1-5). Shared by read.html, novel.html and novels.html.
// Data: chapter_ratings (own vote), chapter_rating_stats (votes/total, realtime), novel_rating_stats (view).

import { supabase } from '../config/supabase.js';
import { el } from './dom.js?v=2';

const D20_HEX = '50,4 90,27 90,73 50,96 10,73 10,27';
const D20_EDGES = 'M50 28V4M50 28L10 27M50 28L90 27M23 74L10 27M23 74L10 73M23 74L50 96'
  + 'M77 74L90 27M77 74L90 73M77 74L50 96M23 74H77M50 28L23 74M50 28L77 74';

// static trusted markup (no user data)
const D20_HTML =
  '<svg class="d20-fill" viewBox="0 0 100 100" aria-hidden="true"><polygon points="' + D20_HEX + '"/></svg>'
  + '<svg class="d20-line" viewBox="0 0 100 100" aria-hidden="true"><polygon points="' + D20_HEX + '"/><path d="' + D20_EDGES + '"/></svg>';

// one d20; fill 0-100 = how much of the interior is coloured (0 = outline only)
export function d20(fill = 0) {
  const icon = el('span', { class: 'd20', 'aria-hidden': 'true' });
  icon.innerHTML = D20_HTML;
  setFill(icon, fill);
  return icon;
}

function setFill(icon, fill) {
  icon.style.setProperty('--fill', Math.max(0, Math.min(100, fill)) + '%');
}

export function average(stats) {
  return stats && stats.votes > 0 ? stats.total / stats.votes : 0;
}

export function formatAverage(stats) {
  return average(stats).toFixed(1);
}

export function countLabel(votes) {
  return votes + (votes === 1 ? ' rating' : ' ratings');
}

// five d20s showing an average with fractional fill; no votes = outline only
export function averageRow(stats) {
  const avg = average(stats);
  const label = stats?.votes > 0
    ? 'Average ' + formatAverage(stats) + ' out of 5, ' + countLabel(stats.votes)
    : 'Not rated yet';
  const row = el('span', { class: 'd20-row', role: 'img', 'aria-label': label });
  for (let i = 0; i < 5; i += 1) row.append(d20((avg - i) * 100));
  return row;
}

async function fetchChapterStats(chapterId) {
  const { data } = await supabase.from('chapter_rating_stats').select('votes, total').eq('chapter_id', chapterId).maybeSingle();
  return data || { votes: 0, total: 0 };
}

// ---------- chapter widget (read.html) ----------

export function mountChapterRating(container, chapterId, userId) {
  const state = { stats: { votes: 0, total: 0 }, mine: null, hover: null, busy: false };

  const avgHost = el('div', { class: 'rating-avg' });
  const avgText = el('span', { class: 'rating-num' });
  const mineIcons = [1, 2, 3, 4, 5].map(() => d20(0));
  const mineButtons = mineIcons.map((icon, index) => {
    const value = index + 1;
    const button = el('button', { class: 'd20-btn', type: 'button', 'aria-label': 'Rate ' + value + ' out of 5' }, icon);
    button.addEventListener('click', () => vote(value));
    button.addEventListener('mouseenter', () => { state.hover = value; paint(); });
    button.addEventListener('focus', () => { state.hover = value; paint(); });
    button.addEventListener('blur', () => { state.hover = null; paint(); });
    return button;
  });
  const mineHost = el('div', { class: 'd20-input', role: 'group', 'aria-label': 'Your rating' }, mineButtons);
  mineHost.addEventListener('mouseleave', () => { state.hover = null; paint(); });
  const clearButton = el('button', { class: 'hn-btn ghost small', type: 'button', text: 'Clear', hidden: true });
  clearButton.addEventListener('click', clear);
  const status = el('p', { class: 'hn-form-status', role: 'status' });

  container.replaceChildren(
    el('h2', { class: 'rating-title', text: 'Rate this chapter' }),
    el('div', { class: 'rating-line' }, avgHost, avgText),
    el('div', { class: 'rating-line' }, el('span', { class: 'rating-label', text: 'Your rating' }), mineHost, clearButton),
    status
  );
  container.hidden = false;

  function paint() {
    avgHost.replaceChildren(averageRow(state.stats));
    avgText.textContent = state.stats.votes > 0
      ? formatAverage(state.stats) + ' / 5 · ' + countLabel(state.stats.votes)
      : 'No ratings yet';
    const shown = state.hover ?? state.mine ?? 0;
    mineIcons.forEach((icon, index) => setFill(icon, index < shown ? 100 : 0));
    mineButtons.forEach((button, index) => button.setAttribute('aria-pressed', String(state.mine === index + 1)));
    clearButton.hidden = state.mine == null;
  }

  async function refreshStats() {
    state.stats = await fetchChapterStats(chapterId);
    paint();
  }

  async function vote(value) {
    if (state.busy || state.mine === value) return;
    state.busy = true;
    status.className = 'hn-form-status';
    status.textContent = '';
    const request = state.mine == null
      ? supabase.from('chapter_ratings').insert({ chapter_id: chapterId, rating: value })
      : supabase.from('chapter_ratings').update({ rating: value }).eq('chapter_id', chapterId).eq('user_id', userId);
    const { error } = await request;
    state.busy = false;
    if (error) {
      status.className = 'hn-form-status error';
      status.textContent = 'Could not save your rating. Try again.';
      return;
    }
    state.mine = value;
    await refreshStats();
  }

  async function clear() {
    if (state.busy || state.mine == null) return;
    state.busy = true;
    const { error } = await supabase.from('chapter_ratings').delete().eq('chapter_id', chapterId).eq('user_id', userId);
    state.busy = false;
    if (error) {
      status.className = 'hn-form-status error';
      status.textContent = 'Could not remove your rating. Try again.';
      return;
    }
    state.mine = null;
    await refreshStats();
  }

  (async () => {
    const [stats, mine] = await Promise.all([
      fetchChapterStats(chapterId),
      supabase.from('chapter_ratings').select('rating').eq('chapter_id', chapterId).eq('user_id', userId).maybeSingle()
    ]);
    state.stats = stats;
    state.mine = mine.data?.rating ?? null;
    paint();
  })();

  const channel = supabase
    .channel('chapter-rating-' + chapterId)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'chapter_rating_stats', filter: 'chapter_id=eq.' + chapterId },
      refreshStats)
    .subscribe();
  window.addEventListener('pagehide', () => supabase.removeChannel(channel));
}

// ---------- novel rating (pooled across published chapters) ----------

async function fetchNovelStats(novelId) {
  const { data } = await supabase.from('novel_rating_stats').select('votes, total').eq('novel_id', novelId).maybeSingle();
  return data || { votes: 0, total: 0 };
}

export function mountNovelRating(container, novelId) {
  async function paint() {
    const stats = await fetchNovelStats(novelId);
    container.replaceChildren(
      averageRow(stats),
      el('span', { class: 'rating-num', text: stats.votes > 0
        ? formatAverage(stats) + ' / 5 · ' + countLabel(stats.votes) + ' across all chapters'
        : 'No ratings yet' })
    );
  }
  paint();

  const channel = supabase
    .channel('novel-rating-' + novelId)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chapter_rating_stats' }, paint)
    .subscribe();
  window.addEventListener('pagehide', () => supabase.removeChannel(channel));
}

// library cards: { [novelId]: {votes,total} } for many novels in one query
export async function fetchNovelStatsMap(novelIds) {
  if (!novelIds.length) return {};
  const { data } = await supabase.from('novel_rating_stats').select('novel_id, votes, total').in('novel_id', novelIds);
  return Object.fromEntries((data || []).map((row) => [row.novel_id, row]));
}

export function compactRating(stats) {
  const hasVotes = stats && stats.votes > 0;
  return el('span', { class: 'rating-compact' + (hasVotes ? '' : ' empty') },
    d20(hasVotes ? 100 : 0),
    el('span', { text: hasVotes ? formatAverage(stats) + ' (' + stats.votes + ')' : 'Not rated' })
  );
}
