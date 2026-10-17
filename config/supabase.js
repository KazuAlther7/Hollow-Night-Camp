import { createClient } from
  "https://esm.sh/@supabase/supabase-js@2";

// Konfigurasi Supabase Hollow Night Camp
const SUPABASE_URL =
  "https://wqdrzylnkehwdktkxxnl.supabase.co";

// Ganti dengan publishable key milik lu
const SUPABASE_KEY = "sb_publishable_YT6iO-0pOYsIxRH3pdEiVA_o73l8Nso";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
