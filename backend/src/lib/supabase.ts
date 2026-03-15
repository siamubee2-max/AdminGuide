import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: SupabaseClient | null = null;

/**
 * Get the Supabase client instance.
 * Returns null if Supabase is not configured (falls back to in-memory storage).
 */
export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      "[Supabase] Not configured — using in-memory storage. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for persistence."
    );
    return null;
  }

  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    console.log("[Supabase] Client initialized for:", SUPABASE_URL);
  }

  return supabase;
}

/**
 * Check if Supabase is available and configured.
 */
export function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}
