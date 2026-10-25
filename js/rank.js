// HOLLOW NIGHT CAMP — Camp Rank client (server side: sql/camp_rank.sql). null when the SQL has not been run, so the card keeps its placeholder.
import { supabase } from '../config/supabase.js';

// { exp, tier, name, tier_min, next_name, next_min } or null.
export async function getCampRank() {
  const { data, error } = await supabase.rpc('camp_rank');
  if (error || !data || !Number.isInteger(data.tier)) return null;
  return data;
}
