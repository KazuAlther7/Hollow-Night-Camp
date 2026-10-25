// HOLLOW NIGHT CAMP — Reading Streak client (server side: sql/reading_streak.sql).
// The day boundary uses the timezone chosen in Settings (hnc_timezone), falling back to the browser's.
// Everything degrades quietly: if the SQL has not been run, streak is null and the profile card simply hides it.

import { supabase } from '../config/supabase.js';
import { activeTimezone } from './status-widget.js?v=3';

let loggedFor = null; // 'timezone|local day' already sent from this page

// Call after the reader really read something (a saved scroll position), not merely on opening a chapter.
export async function logReadingDay() {
  const tz = activeTimezone();
  let day;
  try { day = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date()); } catch { day = new Date().toDateString(); }
  const key = tz + '|' + day;
  if (loggedFor === key) return;
  loggedFor = key;
  const { error } = await supabase.rpc('log_reading_day', { p_tz: tz });
  if (error) { loggedFor = null; console.warn('Reading streak unavailable (run sql/reading_streak.sql):', error.message); }
}

// Current streak in days, or null when it cannot be read.
export async function getReadingStreak() {
  const { data, error } = await supabase.rpc('reading_streak', { p_tz: activeTimezone() });
  if (error || !Number.isInteger(data)) return null;
  return data;
}

// Highest streak ever, in days, or null when it cannot be read (server side: sql/longest_reading_streak.sql).
export async function getLongestStreak() {
  const { data, error } = await supabase.rpc('longest_reading_streak', { p_tz: activeTimezone() });
  if (error || !Number.isInteger(data)) return null;
  return data;
}
