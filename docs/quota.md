# Free-tier quota plan (Supabase + Cloudflare)

Binding constraints: **Cloudflare Workers 100k requests/day + 10ms CPU per
request**, **Supabase 5GB egress/month + 500MB database**. Supabase API
requests are unlimited — every Worker request that queries Supabase burns
both quotas (Worker invocation + egress), so the goal is *fewer requests,
smaller payloads, shorter CPU*.

## Where quota went

- Homepage mounted 6 parallel API calls (`prayers`/`sermons`/`events` full
  50-row lists sliced to 3–6 items client-side, `daily`, `books`, `streams`).
- Repeat visits refetched everything: no client or `Cache-Control` caching.
- STK status polled every 2–3s (up to 30 Worker + Supabase hits per checkout).
- Claim-status loops polled through backgrounded tabs.
- Sentry: 100% traces + 10% session replays per visitor.
- FX fetched from Wise/exchangerate-api on a 10min per-isolate cache.
- Admin board refetched all 10 endpoints on filter changes and mutations.
- Verification Katz: every scan/probe cost Supabase lookups, no caching.
- 5.9MB unreferenced PNG shipped in `public/images` (removed; `.webp` kept).

## Controls in place

**Frontend (`src/lib/api.ts`)** — GET-only SWR cache + in-flight dedupe:
books/daily/pricing/rate 1h · verses 30min · lists/streams/verify 2min ·
sermons search 60s · status 60s · admin stats 30s. Auth, polls, claim status,
history, and all mutations always hit the network.

**Payloads** — preview sections request only what they render
(`prayers?limit=4`, `sermons?limit=12`, `events?limit=20`).

**Polling** — STK polls at 4s cadence (15 vs 20–30 per checkout), skipped
while `document.hidden`; claim loops skip backgrounded cycles (bounded).
Server STK session TTL (180s) outlives the UI budget.

**Telemetry** — Sentry traces 10%, session replays off, error replays kept.

**Backend** — `Cache-Control: public` on anonymous-safe GETs (lists 60s,
books/verses/daily/rate/pricing 1h, search/verify 60–120s) + in-memory
caches: admin stats 60s, verification results 120s (errors bypass),
bible chapters/search 1h, FX 60min.

**Admin** — filter changes refetch prayers only; member actions refetch
members only; claim resolution refreshes pending + stats only.

## If quota still binds

1. Raise frontend list TTLs (`DEFAULT_TTL_MS` in `src/lib/api.ts`).
2. Lower preview limits further or paginate full pages (currently 50).
3. Move homepage previews to build-time static JSON (Vite) refreshed by cron.
4. Add Supabase read replicas / upgrade before raising Worker limits —
   egress (5GB) binds before Worker requests at current payload sizes.
5. Prune `audit_logs`/`billing_attempts` (>90 days) to protect the 500MB DB cap.
