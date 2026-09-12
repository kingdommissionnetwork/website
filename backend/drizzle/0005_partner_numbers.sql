-- Partner credential numbers: KMN-P-2026/4002 (prefix-category-year/serial).
-- Best practice: the database allocates serials atomically (single-writer RPC),
-- never the client — random frontend numbers collide and repeat. Serials start
-- at 4001 per (category, year). Existing rows keep partner_number NULL until
-- lazily issued on fulfillment/lookup (unique index allows multiple NULLs).
-- Replayable; all statements are IF NOT EXISTS / guarded.

CREATE TABLE IF NOT EXISTS "partner_number_counters" (
  "category" text NOT NULL,
  "year" integer NOT NULL,
  "last_serial" integer NOT NULL DEFAULT 4000,
  PRIMARY KEY ("category", "year")
);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION next_partner_serial(p_category text, p_year integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_next integer;
BEGIN
  INSERT INTO "partner_number_counters" ("category", "year", "last_serial")
  VALUES (p_category, p_year, 4000)
  ON CONFLICT ("category", "year") DO NOTHING;
  UPDATE "partner_number_counters"
  SET "last_serial" = "last_serial" + 1
  WHERE "category" = p_category AND "year" = p_year
  RETURNING "last_serial" INTO v_next;
  RETURN v_next;
END;
$$;
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "partner_number" text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_partner_number_unique" ON "subscriptions" ("partner_number");
--> statement-breakpoint
-- Unguessable credential token for QR deep links (/v/<token> opens the
-- holder's public credential directly — best practice for verifiable IDs:
-- sequential numbers alone must never unlock holder details). 48 hex chars,
-- generated app-side at fulfillment; lazily backfilled like partner_number.
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "verify_token" text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_verify_token_unique" ON "subscriptions" ("verify_token");
