import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client with service role key (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  realtime: {
    transport: ws,
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Create a client scoped to a user's token (for verifying requests)
export function createSupabaseClient(accessToken: string) {
  return createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseServiceKey, {
    realtime: {
      transport: ws,
    },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
