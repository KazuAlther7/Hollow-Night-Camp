import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://wqdrzylnkehwdktkxxnl.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_YT6iO-0pOYsIxRH3pdEiVA_o73l8Nso';

export const supabase = createClient(
SUPABASE_URL,
SUPABASE_PUBLISHABLE_KEY
);
