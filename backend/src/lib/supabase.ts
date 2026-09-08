import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "./env";

/**
 * Resolve SUPABASE_URL from the per-request env store (populated by setEnv
 * middleware) with a fallback to process.env for local non-Worker runtimes.
 * Fail-closed: throws if the value is missing so misconfiguration is loud.
 */
function requireUrl(env?: Record<string, string>): string {
  const val = (env && env["SUPABASE_URL"]) || getEnv("SUPABASE_URL") || process.env.SUPABASE_URL || "";
  if (!val) throw new Error("SUPABASE_URL must be set in Worker bindings or .dev.vars");
  return val;
}

function requireSecretKey(env?: Record<string, string>): string {
  const val = (env && env["SUPABASE_SECRET_KEY"]) || getEnv("SUPABASE_SECRET_KEY") || process.env.SUPABASE_SECRET_KEY || "";
  if (!val) throw new Error("SUPABASE_SECRET_KEY must be set in Worker bindings or .dev.vars");
  return val;
}

function requirePublishableKey(env?: Record<string, string>): string {
  const val = (env && env["SUPABASE_PUBLISHABLE_KEY"]) || getEnv("SUPABASE_PUBLISHABLE_KEY") || process.env.SUPABASE_PUBLISHABLE_KEY || "";
  if (!val) throw new Error("SUPABASE_PUBLISHABLE_KEY must be set in Worker bindings or .dev.vars");
  return val;
}

/**
 * Returns a Supabase service-role client for the current request.
 * Pass `c.env` from the Hono context to guarantee the live Worker
 * bindings are used — this avoids stale module-level singletons that
 * could be built before env is injected.
 */
export function getSupabase(env?: Record<string, string>): SupabaseClient {
  return createClient(requireUrl(env), requireSecretKey(env), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Returns a Supabase publishable-key client for user-facing auth flows.
 * Never falls back to the secret key.
 */
export function createAuthClient(env?: Record<string, string>): SupabaseClient {
  return createClient(requireUrl(env), requirePublishableKey(env), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** @deprecated No-op — kept for test compatibility only. */
export function resetSupabase() {}
