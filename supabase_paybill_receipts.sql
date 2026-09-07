-- =============================================================================
-- Kingdom Missions Network — Paybill ground-truth redemption (fail-closed)
-- Run in Supabase SQL editor AFTER supabase_billing_phases.sql.
-- All statements are idempotent.
--
-- WHY: an M-Pesa SMS code is just a string. Only a provider confirmation
-- (Daraja C2B Confirmation callback or KCB IPN credit notice) proves money
-- reached Paybill 522522 / account 1335674365. Redemptions match against
-- mpesa_paybill_receipts and NEVER activate on format checks alone.
-- =============================================================================

-- 1. Provider-confirmed credits (one row per TransID, immutable once written)
CREATE TABLE IF NOT EXISTS public.mpesa_paybill_receipts (
    id BIGSERIAL PRIMARY KEY,
    trans_id TEXT UNIQUE NOT NULL,
    amount NUMERIC NOT NULL,
    phone TEXT,
    bill_ref TEXT,
    shortcode TEXT,
    trans_time TEXT,
    source TEXT NOT NULL DEFAULT 'daraja_c2b',
    consumed BOOLEAN DEFAULT false,
    consumed_by TEXT,
    consumed_at TIMESTAMP WITH TIME ZONE,
    raw JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_paybill_receipts_trans ON public.mpesa_paybill_receipts(trans_id);
CREATE INDEX IF NOT EXISTS idx_paybill_receipts_unconsumed ON public.mpesa_paybill_receipts(consumed) WHERE consumed = false;
CREATE INDEX IF NOT EXISTS idx_paybill_receipts_phone ON public.mpesa_paybill_receipts(phone);

-- 2. Redemption intents (user pasted a code; fulfilled only on receipt match)
CREATE TABLE IF NOT EXISTS public.payment_claims (
    id BIGSERIAL PRIMARY KEY,
    payment_reference TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT 'Kingdom Partner',
    amount NUMERIC NOT NULL,
    plan_id TEXT,
    plan_name TEXT,
    interval TEXT DEFAULT 'monthly',
    phone TEXT,
    kind TEXT NOT NULL DEFAULT 'subscription',
    status TEXT NOT NULL DEFAULT 'awaiting_receipt',
    receipt_id BIGINT REFERENCES public.mpesa_paybill_receipts(id) ON DELETE SET NULL,
    attempts INTEGER DEFAULT 1,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_payment_claims_ref ON public.payment_claims(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payment_claims_status ON public.payment_claims(status);
CREATE INDEX IF NOT EXISTS idx_payment_claims_email ON public.payment_claims(email);

-- 3. Row Level Security: service-role full access (same pattern as base setup)
ALTER TABLE public.mpesa_paybill_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_claims ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access paybill_receipts') THEN
    CREATE POLICY "Service role full access paybill_receipts" ON public.mpesa_paybill_receipts FOR ALL USING (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access payment_claims') THEN
    CREATE POLICY "Service role full access payment_claims" ON public.payment_claims FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;
