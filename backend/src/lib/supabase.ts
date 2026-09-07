import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "./env";

let _supabase: SupabaseClient | null = null;

const DEFAULT_SUPABASE_URL = "https://wvjoxhpoxytkjuuridpv.supabase.co";
const DEFAULT_SUPABASE_KEY = "REDACTED_SUPABASE_KEY";

function sanitizeUrl(rawUrl: string, isTest: boolean): string {
  if (!rawUrl) return !isTest ? DEFAULT_SUPABASE_URL : "";
  if (rawUrl.includes("pfrddgiauxibzgzllkbd")) return DEFAULT_SUPABASE_URL;
  return rawUrl;
}

function sanitizeKey(rawKey: string, isTest: boolean, isDefaultUrl: boolean): string {
  if (isDefaultUrl) return DEFAULT_SUPABASE_KEY;
  if (!rawKey) return !isTest ? DEFAULT_SUPABASE_KEY : "";
  if (rawKey.includes("pfrdd")) return DEFAULT_SUPABASE_KEY;
  return rawKey;
}

export function getSupabase() {
  if (!_supabase) {
    const isTest = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
    const rawUrl = getEnv("SUPABASE_URL") || process.env.SUPABASE_URL || "";
    const url = sanitizeUrl(rawUrl, isTest);
    const isDefault = url === DEFAULT_SUPABASE_URL && rawUrl !== DEFAULT_SUPABASE_URL;
    const rawKey = getEnv("SUPABASE_SERVICE_KEY") || getEnv("SUPABASE_SERVICE_ROLE_KEY") || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const key = sanitizeKey(rawKey, isTest, isDefault);
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
    _supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabase;
}

export function createAuthClient() {
  const isTest = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
  const rawUrl = getEnv("SUPABASE_URL") || process.env.SUPABASE_URL || "";
  const url = sanitizeUrl(rawUrl, isTest);
  const isDefault = url === DEFAULT_SUPABASE_URL && rawUrl !== DEFAULT_SUPABASE_URL;
  const rawKey = getEnv("SUPABASE_ANON_KEY") || process.env.SUPABASE_ANON_KEY || getEnv("SUPABASE_SERVICE_KEY") || getEnv("SUPABASE_SERVICE_ROLE_KEY") || "";
  const key = sanitizeKey(rawKey, isTest, isDefault);
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function resetSupabase() {
  _supabase = null;
}
