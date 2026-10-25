// HOLLOW NIGHT CAMP — owned collectibles for the Backpack (server side: sql/collectibles.sql). [] when the SQL has not been run.
import { supabase } from '../config/supabase.js';

export async function getCollectibles() {
  const { data, error } = await supabase.from('user_collectibles')
    .select('acquired_at, collectible_definitions(key, title, description, category, asset_path, sort)');
  if (error || !Array.isArray(data)) return [];
  return data.filter((r) => r.collectible_definitions).map((r) => ({ ...r.collectible_definitions, acquired_at: r.acquired_at }))
    .sort((a, b) => a.sort - b.sort);
}
