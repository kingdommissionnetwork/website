import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "./env";

let _supabase: SupabaseClient | null = null;

/**
 * Fail-closed env access: no hardcoded defaults. Service keys must come
 * from the Worker bindings / process env. Throwing here prevents silently
 * running against the wrong project or with a leaked key baked into source.
 */
function requireSupabaseUrl(): string {
  const rawUrl = getEnv("SUPABASE_URL") || process.env.SUPABASE_URL || "";
  if (!rawUrl) throw new Error("SUPABASE_URL must be set");
  return rawUrl;
}

function requireServiceKey(): string {
  const rawKey =
    getEnv("SUPABASE_SECRET_KEY") ||
    getEnv("SUPABASE_SERVICE_KEY") ||
    getEnv("SUPABASE_SERVICE_ROLE_KEY") ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "";
  if (!rawKey) throw new Error("SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_KEY) must be set");
  return rawKey;
}

export function getSupabase() {
  if (!_supabase) {
    const url = requireSupabaseUrl();
    const key = requireServiceKey();
    _supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabase;
}

export function createAuthClient() {
  const url = requireSupabaseUrl();
  // Prefer publishable/anon key for user-facing auth; fall back to secret/service key only
  // when publishable is not configured (e.g. backend-only flows).
  const pubKey =
    getEnv("SUPABASE_PUBLISHABLE_KEY") ||
    getEnv("SUPABASE_ANON_KEY") ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";
  const key = pubKey || requireServiceKey();
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function resetSupabase() {
  _supabase = null;
}
