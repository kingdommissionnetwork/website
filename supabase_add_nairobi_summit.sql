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

-- Step 2: Insert the Nairobi Leaders Summit 2026 event
-- Image served from: /images/nairobi-leaders-summit-2026.png
INSERT INTO public.events (
  title, date, end_date, day, month,
  time, timezone, location, country,
  is_online, image, description, badge
)
VALUES (
  'Nairobi Leaders Summit 2026',
  '2026-10-20',
  '2026-10-23',
  '20',
  'OCT',
  '9:00 AM – 6:00 PM',
  'EAT',
  'Nairobi, Kenya',
  'Kenya',
  false,
  '/images/nairobi-leaders-summit-2026.png',
  'October 20–23, 2026. A landmark apostolic leaders'' summit gathering senior pastors, bishops, apostles, and ministry leaders across East Africa for strategic kingdom alignment, prophetic impartation, and revival fire. Join us as we unite in one accord for a fresh outpouring of the Holy Spirit across the nations.',
  'SUMMIT'
)
ON CONFLICT DO NOTHING;

-- Optional: Backfill country on existing events
UPDATE public.events SET country = 'Zimbabwe' WHERE title = 'Zimbabwe Kingdom Missions Conference' AND country IS NULL;
UPDATE public.events SET country = 'Pakistan' WHERE title = 'Pakistan Kingdom Gospel Mission' AND country IS NULL;
UPDATE public.events SET country = 'Kenya' WHERE title IN ('New Dawn Conference', 'Nairobi Leaders Summit 2026') AND country IS NULL;
