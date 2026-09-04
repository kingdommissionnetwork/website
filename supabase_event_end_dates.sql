-- Migration: support multi-day events so expiry is calculated from the
-- last day of the event instead of the start date.
-- Run once in the Supabase Dashboard -> SQL Editor.
-- Safe to re-run (column add is idempotent, updates only fill NULLs).

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_date TEXT;

UPDATE public.events
SET end_date = '2026-10-10'
WHERE title = 'Zimbabwe Kingdom Missions Conference' AND end_date IS NULL;

UPDATE public.events
SET end_date = '2026-12-06'
WHERE title = 'Pakistan Kingdom Gospel Mission' AND end_date IS NULL;

UPDATE public.events
SET end_date = '2027-03-16'
WHERE title = 'New Dawn Conference' AND end_date IS NULL;
