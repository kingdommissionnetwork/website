-- Billing engine tables (replayable; run in order after 0000-0002).
-- Canonical schema for the live database: subscriptions, payment_claims,
-- mpesa_paybill_receipts, subscriber_otps, audit_logs, billing_attempts.
-- Backend uses the service-role key (bypasses RLS); RLS is enabled with no
-- public policies so anon/authenticated keys cannot read PII/financial rows.
-- Run in Supabase SQL editor or via `supabase db push`.

CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" serial PRIMARY KEY NOT NULL,
  "subscriber_name" text NOT NULL,
  "subscriber_email" text NOT NULL,
  "plan_name" text NOT NULL,
  "plan_id" text,
  "amount" integer NOT NULL,
  "currency" text DEFAULT 'KES' NOT NULL,
  "usd_amount" numeric,
  "exchange_rate" numeric,
  "interval" text DEFAULT 'monthly' NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "billing_cycle" text,
  "retry_count" integer DEFAULT 0 NOT NULL,
  "next_retry_at" timestamptz,
  "payment_provider" text,
  "payment_reference" text,
  "subscription_code" text,
  "customer_code" text,
  "current_period_start" timestamptz,
  "current_period_end" timestamptz,
  "canceled_at" timestamptz,
  "cancel_reason" text,
  "paused_at" timestamptz,
  "grace_ends_at" timestamptz,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "subscriptions_payment_reference_unique" UNIQUE("payment_reference")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_email_idx" ON "subscriptions" ("subscriber_email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_period_end_idx" ON "subscriptions" ("current_period_end");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_next_retry_idx" ON "subscriptions" ("next_retry_at");
--> statement-breakpoint
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "payment_claims" (
  "id" serial PRIMARY KEY NOT NULL,
  "payment_reference" text NOT NULL,
  "email" text NOT NULL,
  "name" text NOT NULL,
  "amount" integer NOT NULL,
  "plan_id" text,
  "plan_name" text,
  "interval" text DEFAULT 'monthly' NOT NULL,
  "phone" text,
  "kind" text DEFAULT 'subscription' NOT NULL,
  "status" text DEFAULT 'awaiting_receipt' NOT NULL,
  "receipt_id" integer,
  "attempts" integer DEFAULT 1 NOT NULL,
  "note" text,
  "mpesa_message" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_claims_ref_idx" ON "payment_claims" ("payment_reference");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_claims_status_idx" ON "payment_claims" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_claims_email_idx" ON "payment_claims" ("email");
--> statement-breakpoint
ALTER TABLE "payment_claims" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "mpesa_paybill_receipts" (
  "id" serial PRIMARY KEY NOT NULL,
  "trans_id" text NOT NULL,
  "amount" integer NOT NULL,
  "phone" text,
  "bill_ref" text,
  "shortcode" text,
  "trans_time" text,
  "source" text NOT NULL,
  "raw" jsonb DEFAULT '{}'::jsonb,
  "consumed" boolean DEFAULT false NOT NULL,
  "consumed_by" text,
  "consumed_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "mpesa_paybill_receipts_trans_id_unique" UNIQUE("trans_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mpesa_paybill_receipts_consumed_idx" ON "mpesa_paybill_receipts" ("consumed");
--> statement-breakpoint
ALTER TABLE "mpesa_paybill_receipts" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "subscriber_otps" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "code_hash" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "consumed" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriber_otps_email_idx" ON "subscriber_otps" ("email");
--> statement-breakpoint
ALTER TABLE "subscriber_otps" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" serial PRIMARY KEY NOT NULL,
  "actor" text NOT NULL,
  "action" text NOT NULL,
  "target_type" text NOT NULL,
  "target_id" text NOT NULL,
  "details" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_actor_idx" ON "audit_logs" ("actor");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_created_idx" ON "audit_logs" ("created_at");
--> statement-breakpoint
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "billing_attempts" (
  "id" serial PRIMARY KEY NOT NULL,
  "subscription_id" integer,
  "subscriber_email" text NOT NULL,
  "amount" integer NOT NULL,
  "provider" text NOT NULL,
  "status" text NOT NULL,
  "attempt_no" integer NOT NULL,
  "next_retry_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "billing_attempts_email_idx" ON "billing_attempts" ("subscriber_email");
--> statement-breakpoint
ALTER TABLE "billing_attempts" ENABLE ROW LEVEL SECURITY;

-- Hot-path indexes for the admin dashboard (see admin.ts /stats).
CREATE INDEX IF NOT EXISTS "donations_created_at_idx" ON "donations" ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "donations_status_idx" ON "donations" ("status");
--> statement-breakpoint
-- events.end_date backfill is in 0004_missing_columns.sql.
