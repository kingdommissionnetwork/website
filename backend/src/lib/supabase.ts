import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "./env";

let _supabase: SupabaseClient | null = null;

const DEFAULT_SUPABASE_URL = "https://wvjoxhpoxytkjuuridpv.supabase.co";
const DEFAULT_SUPABASE_KEY = "REDACTED_SUPABASE_KEY";

export function getSupabase() {
  if (!_supabase) {
    const isTest = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
    const url = getEnv("SUPABASE_URL") || process.env.SUPABASE_URL || (!isTest ? DEFAULT_SUPABASE_URL : "");
    const key = getEnv("SUPABASE_SERVICE_KEY") || process.env.SUPABASE_SERVICE_KEY || (!isTest ? DEFAULT_SUPABASE_KEY : "");
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
    _supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabase;
}

export function resetSupabase() {
  _supabase = null;
}
