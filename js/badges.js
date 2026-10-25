// HOLLOW NIGHT CAMP — Badges client (server side: sql/badges.sql). The browser only reads and picks; awards happen on the server.
// Everything degrades quietly: null when the SQL has not been run, so the profile card keeps its slots disabled.

import { supabase } from '../config/supabase.js';
import { activeTimezone } from './status-widget.js?v=3';

// Asks the server to award whatever is earned (Camp Rank badges, Night Owl). Idempotent.
export async function syncBadges() {
  const { error } = await supabase.rpc('sync_badges', { p_tz: activeTimezone() });
  if (error) console.warn('Badges unavailable (run sql/badges.sql):', error.message);
}

// { owned: [{ key, title, description, kind, asset_path, sort, awarded_at }], slots: [badge|null, badge|null, badge|null] } or null.
export async function getBadges() {
  const [own, slots] = await Promise.all([
    supabase.from('user_badges').select('badge_key, awarded_at, badge_definitions(key, title, description, kind, asset_path, sort)'),
    supabase.from('user_badge_slots').select('slot, badge_key')
  ]);
  if (own.error || !Array.isArray(own.data)) return null;
  const owned = own.data
    .map((r) => (r.badge_definitions ? { ...r.badge_definitions, awarded_at: r.awarded_at } : null))
    .filter(Boolean)
    .sort((a, b) => (a.kind === b.kind ? b.sort - a.sort : a.kind === 'achievement' ? -1 : 1));
  const picked = [null, null, null];
  if (!slots.error && Array.isArray(slots.data)) {
    for (const s of slots.data) if (s.slot >= 0 && s.slot <= 2) picked[s.slot] = owned.find((b) => b.key === s.badge_key) || null;
  }
  return { owned, slots: picked };
}

export async function loadBadges() {
  await syncBadges();
  return getBadges();
}

// key = null empties the slot. Returns an error message, or null on success.
export async function setBadgeSlot(slot, key) {
  const { error } = await supabase.rpc('set_badge_slot', { p_slot: slot, p_key: key });
  return error ? error.message : null;
}
