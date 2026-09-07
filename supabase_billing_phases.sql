-- =============================================================================
-- Kingdom Missions Network — Billing hardening phases (P0 security + P2 lifecycle)
-- Run in Supabase SQL editor AFTER supabase_fresh_setup.sql.
-- All statements are idempotent (IF NOT EXISTS / guarded DO blocks).
-- =============================================================================

-- 1. Subscription lifecycle columns (status vocabulary: active, past_due,
--    grace, suspended, paused, canceled)
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS plan_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS grace_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- 2. One-time account-claim codes (stores SHA-256 hashes only, never codes)
CREATE TABLE IF NOT EXISTS public.subscriber_otps (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0,
    consumed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_subscriber_otps_email ON public.subscriber_otps(email);
CREATE INDEX IF NOT EXISTS idx_subscriber_otps_expires ON public.subscriber_otps(expires_at);

-- 3. Dunning / renewal attempt ledger
CREATE TABLE IF NOT EXISTS public.billing_attempts (
    id BIGSERIAL PRIMARY KEY,
    subscription_id BIGINT REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    subscriber_email TEXT,
    amount NUMERIC,
    provider TEXT,
    reference TEXT,
    status TEXT DEFAULT 'reminder_sent',
    attempt_no INTEGER DEFAULT 1,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    detail JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_billing_attempts_email ON public.billing_attempts(subscriber_email);
CREATE INDEX IF NOT EXISTS idx_billing_attempts_sub ON public.billing_attempts(subscription_id);

-- 4. Billing audit trail (also used by admin operations hub)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- 5. Helpful indexes for renewal/dunning scans
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON public.subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_retry ON public.subscriptions(next_retry_at);

-- 6. Row Level Security: service-role full access (same pattern as base setup)
ALTER TABLE public.subscriber_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access subscriber_otps') THEN
    CREATE POLICY "Service role full access subscriber_otps" ON public.subscriber_otps FOR ALL USING (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access billing_attempts') THEN
    CREATE POLICY "Service role full access billing_attempts" ON public.billing_attempts FOR ALL USING (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access audit_logs') THEN
    CREATE POLICY "Service role full access audit_logs" ON public.audit_logs FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- 7. Normalize legacy "cancelled" spellings to canonical "canceled"
UPDATE public.subscriptions SET status = 'canceled' WHERE status = 'cancelled';
