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

const clientCache = new Map<string, SupabaseClient>();

function cachedClient(cacheKey: string, factory: () => SupabaseClient): SupabaseClient {
  const hit = clientCache.get(cacheKey);
  if (hit) return hit;
  const client = factory();
  // Bound the cache: isolates are long-lived; creds rarely rotate.
  if (clientCache.size > 20) clientCache.clear();
  clientCache.set(cacheKey, client);
  return client;
}

/**
 * Returns a Supabase service-role client for the current request.
 * Memoized per isolate by URL+key (avoids reconstructing per request)
 * while still keying on live Worker bindings — no stale singletons.
 */
export function getSupabase(env?: Record<string, string>): SupabaseClient {
  const url = requireUrl(env);
  const key = requireSecretKey(env);
  return cachedClient(`svc:${url}:${key.slice(-8)}`, () =>
    createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  );
}

/**
 * Returns a Supabase publishable-key client for user-facing auth flows.
 * Never falls back to the secret key.
 */
export function createAuthClient(env?: Record<string, string>): SupabaseClient {
  const url = requireUrl(env);
  const key = requirePublishableKey(env);
  return cachedClient(`pub:${url}:${key.slice(-8)}`, () =>
    createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  );
}

/** @deprecated No-op — kept for test compatibility only. */
export function resetSupabase() {}
