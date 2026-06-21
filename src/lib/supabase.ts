import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase access for cloud sync.
 *
 * The SDK is **lazy-loaded**: `isSyncConfigured()` only reads env vars (cheap,
 * no bundle cost), and the heavy client is dynamically imported the first time
 * a session is actually started/joined. So the base app stays lean and the SDK
 * never loads for people who don't use sync.
 *
 * `NEXT_PUBLIC_*` keys are public by design and protected by the locked-down
 * `op_session_*` RPCs. The secret service-role key is never used here.
 */
let cached: SupabaseClient | null | undefined;

function readEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

/** Cheap, synchronous check used to gate the Sync UI (no SDK import). */
export function isSyncConfigured(): boolean {
  const { url, key } = readEnv();
  return Boolean(url && key);
}

/** Dynamically import + create (and cache) the client. Null if not configured. */
export async function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (cached !== undefined) return cached;
  const { url, key } = readEnv();
  if (!url || !key) {
    cached = null;
    return null;
  }
  const { createClient } = await import('@supabase/supabase-js');
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 5 } },
  });
  return cached;
}
