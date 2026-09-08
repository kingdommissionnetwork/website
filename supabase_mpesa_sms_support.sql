-- =============================================================================
-- Kingdom Missions Network — M-Pesa SMS fast-verification support
-- Run in Supabase SQL editor. All statements are idempotent.
--
-- WHY: partners paste the full M-Pesa confirmation SMS on the subscription
-- checkout so admins can verify instantly against the Paybill statement.
-- The 24/7 support line (+254 792 373 015) is frontend-only (no DB change).
-- =============================================================================

-- 1. Store the pasted SMS on payment claims (subscription flow)
ALTER TABLE public.payment_claims
  ADD COLUMN IF NOT EXISTS mpesa_message TEXT;

-- Ensure the generic note column exists (older installs may predate it)
ALTER TABLE public.payment_claims
  ADD COLUMN IF NOT EXISTS note TEXT;

CREATE INDEX IF NOT EXISTS idx_payment_claims_mpesa_message
  ON public.payment_claims(payment_reference);
