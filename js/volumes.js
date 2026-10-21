// HOLLOW NIGHT CAMP — volumes / arcs. A chapter belongs to a volume by id, so grouping never depends
// on where two same-named chapters happen to sit.

import { supabase } from '../config/supabase.js';

export async function loadVolumes(novelId) {
  const { data, error } = await supabase
    .from('volumes')
    .select('id, name, position')
    .eq('novel_id', novelId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// order: chapters without a volume first, then by volume order, then by chapter position
export function sortChapters(chapters, volumes) {
  const rank = new Map(volumes.map((volume, index) => [volume.id, index]));
  const rankOf = (chapter) => (chapter.volume_id && rank.has(chapter.volume_id) ? rank.get(chapter.volume_id) : -1);
  return [...chapters].sort((a, b) =>
    rankOf(a) - rankOf(b)
    || (a.position ?? 0) - (b.position ?? 0)
    || String(a.created_at || '').localeCompare(String(b.created_at || ''))
  );
}

const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

// returns the existing volume with that name, or creates it at the end of the order
export async function createVolume(novelId, name, volumes) {
  const clean = name.trim();
  const existing = volumes.find((volume) => sameName(volume.name, clean));
  if (existing) return existing;

  const position = volumes.reduce((max, volume) => Math.max(max, volume.position ?? 0), 0) + 1;
  const { data, error } = await supabase
    .from('volumes')
    .insert({ novel_id: novelId, name: clean, position })
    .select('id, name, position')
    .single();

  if (error) {
    if (error.code === '23505') {
      const fresh = (await loadVolumes(novelId)).find((volume) => sameName(volume.name, clean));
      if (fresh) return fresh;
    }
    throw error;
  }
  return data;
}
