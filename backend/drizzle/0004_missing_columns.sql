-- Backfill columns referenced in code but missing from 0000 snapshot.
-- Replayable; all statements are IF NOT EXISTS / guarded.

-- admin.ts /stats selects events.date + events.end_date for active-event math.
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "end_date" text;
--> statement-breakpoint
-- donations.verify-receipt and admin members list expect these filters.
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now();
--> statement-breakpoint
