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

function requireSecretKey(): string {
  const rawKey = getEnv("SUPABASE_SECRET_KEY") || process.env.SUPABASE_SECRET_KEY || "";
  if (!rawKey) throw new Error("SUPABASE_SECRET_KEY must be set");
  return rawKey;
}

export function getSupabase() {
  if (!_supabase) {
    const url = requireSupabaseUrl();
    const key = requireSecretKey();
    _supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabase;
}

function requirePublishableKey(): string {
  const rawKey = getEnv("SUPABASE_PUBLISHABLE_KEY") || process.env.SUPABASE_PUBLISHABLE_KEY || "";
  if (!rawKey) throw new Error("SUPABASE_PUBLISHABLE_KEY must be set");
  return rawKey;
}

export function createAuthClient() {
  const url = requireSupabaseUrl();
  // User-facing auth must run in anon/publishable context — never fall back
  // to the secret key, which would execute user flows as service-role.
  const key = requirePublishableKey();
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function resetSupabase() {
  _supabase = null;
}
