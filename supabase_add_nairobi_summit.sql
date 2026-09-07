-- ============================================================
-- Migration: Nairobi Leaders Summit 2026 + Missing Columns
-- Run once in Supabase Dashboard → SQL Editor.
-- SAFE TO RE-RUN — all operations are idempotent.
-- ============================================================

-- Step 1: Ensure extended event columns exist (idempotent)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS date_range TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS partnership_url TEXT;

-- Step 2: Remove any accidental duplicate/fake event from previous script
DELETE FROM public.events WHERE title = 'Nairobi Leaders Summit 2026';

-- Step 3: Update the real Leaders Summit 2026 — Nairobi event with official image, badge and country
UPDATE public.events
SET
  image = '/images/nairobi-leaders-summit-2026.png',
  badge = 'SUMMIT',
  country = 'Kenya'
WHERE title = 'Leaders Summit 2026 — Nairobi';

-- Step 4: Backfill country on existing events
UPDATE public.events SET country = 'Zimbabwe' WHERE title = 'Zimbabwe Kingdom Missions Conference' AND country IS NULL;
UPDATE public.events SET country = 'Pakistan' WHERE title = 'Pakistan Kingdom Gospel Mission' AND country IS NULL;
UPDATE public.events SET country = 'Kenya' WHERE title IN ('New Dawn Conference', 'Leaders Summit 2026 — Nairobi') AND country IS NULL;

