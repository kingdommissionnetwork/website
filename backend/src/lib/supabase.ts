import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "./env";

let _supabase: SupabaseClient | null = null;

const DEFAULT_SUPABASE_URL = "https://wvjoxhpoxytkjuuridpv.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2am94aHBveHl0a2p1dXJpZHB2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODE5NzQ0MiwiZXhwIjoyMTAzNzczNDQyfQ.1OShcKcWQPkMWZSMhIM_9WfNvKez3KkSgmjvKpR3fgw";

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
