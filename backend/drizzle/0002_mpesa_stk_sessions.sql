-- Durable M-Pesa STK checkout sessions.
-- Run in Supabase SQL editor (or via drizzle-kit migrate).
-- Callbacks/queries can land on a different Worker isolate than the stkpush
-- trigger, so sessions must survive restarts and share across instances.
CREATE TABLE IF NOT EXISTS "mpesa_stk_sessions" (
  "checkout_request_id" text PRIMARY KEY NOT NULL,
  "merchant_request_id" text,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "phone" text NOT NULL,
  "amount" integer NOT NULL,
  "plan_name" text,
  "plan_id" text,
  "interval" text DEFAULT 'monthly',
  "status" text DEFAULT 'pending' NOT NULL,
  "receipt_code" text,
  "fulfilled" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mpesa_stk_sessions_status_idx" ON "mpesa_stk_sessions" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mpesa_stk_sessions_email_idx" ON "mpesa_stk_sessions" ("email");
--> statement-breakpoint
-- Contains PII (name/email/phone): backend uses the service-role key which
-- bypasses RLS, so enabling it blocks anon/authenticated keys with no
-- extra policy needed and no backend breakage.
ALTER TABLE "mpesa_stk_sessions" ENABLE ROW LEVEL SECURITY;
