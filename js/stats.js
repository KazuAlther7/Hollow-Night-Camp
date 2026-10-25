// HOLLOW NIGHT CAMP — Statistik tab data (Camp Profile card). Every figure is read per user; each one fails on its own (null) so the tab never breaks.
// Chapters read: a chapter counts once the saved reading progress reached READ_AT percent (the bottom-of-screen tracker rarely hits a clean 100).

import { supabase } from '../config/supabase.js';

export const READ_AT = 90;

const count = (query) => query.then(({ count: n, error }) => (error || !Number.isInteger(n) ? null : n), () => null);

async function chapters(userId) {
  const [read, total] = await Promise.all([
    count(supabase.from('reading_progress').select('chapter_id', { count: 'exact', head: true }).eq('user_id', userId).gte('progress', READ_AT)),
    count(supabase.from('chapters').select('id', { count: 'exact', head: true }).eq('status', 'published'))
  ]);
  return { read, total };
}

const theories = (userId) => count(supabase.from('theories').select('id', { count: 'exact', head: true }).eq('author_id', userId));

// Arcade record = Amber Gacha Machine: total Amber won (server value), jackpots and leaderboard position.
async function arcade() {
  const [state, board] = await Promise.all([supabase.rpc('slot_state'), supabase.rpc('slot_leaderboard', { lim: 200 })]);
  const me = !board.error && Array.isArray(board.data) ? board.data.find((r) => r.is_me) : null;
  const totalWon = !state.error && Number.isFinite(Number(state.data?.total_won)) ? Number(state.data.total_won) : me ? Number(me.total_won) : null;
  if (totalWon == null && !me) return null;
  return { totalWon: totalWon ?? 0, jackpots: me ? Number(me.jackpots) || 0 : 0, pos: me ? Number(me.pos) : null };
}

export async function getCampStats({ userId, streak = null, longestStreak = null }) {
  const [ch, th, ar] = await Promise.all([chapters(userId), theories(userId), arcade()]);
  const best = Number.isInteger(longestStreak) ? Math.max(longestStreak, Number.isInteger(streak) ? streak : 0) : null;
  return { chapters: ch, theories: th, arcade: ar, streak: Number.isInteger(streak) ? streak : null, longestStreak: best };
}
