# Rate limiting — production controls

`backend/src/lib/rateLimiter.ts` is an in-memory per-Worker-isolate backstop
(20 req/min standard, 5 req/min strict). It does NOT survive isolate rotation
and is ineffective against IP rotation. Production brute-force protection
depends on Cloudflare edge rules below. The repo reflects the actual control
via this document + the in-code backstop.

## Required Cloudflare WAF / Rate Limiting Rules

Create in Cloudflare dashboard → Security → WAF → Rate limiting rules
(or via API). All rules: action Block (or Managed Challenge for login),
period 60s, match on `cf-connecting-ip` (never `X-Forwarded-For`).

| # | Route | Limit | Purpose |
|---|-------|-------|---------|
| 1 | `POST /api/auth/*` | 5/min/IP | login/OTP brute-force |
| 2 | `POST /api/subscriptions/mpesa/stkpush` | 5/min/IP + WAF `cf.threat_score > 10` challenge | STK harassment vector; app also enforces per-phone 3/hr (`stkPhoneBuckets`) |
| 3 | `POST /api/subscriptions/mpesa/verify` | 5/min/IP | code redemption probing |
| 4 | `POST /api/subscriptions/claim/*` | 5/min/IP | OTP brute-force |
| 5 | `GET /api/subscriptions/status/*` | 20/min/IP | enumeration backstop (response is redacted) |
| 6 | `GET /api/donations/verify-receipt` | 20/min/IP | verification probing |
| 7 | `POST /api/subscriptions/mpesa/c2b-confirmation`, `/mpesa/kcb-ipn`, `/mpesa/kcb-callback` | allowlist provider IPs + require `x-webhook-secret` | forged receipt ingest; app fails closed when `MPESA_WEBHOOK_SECRET` is set (required in production) |

## Durable limiter (future)

If edge rules are unavailable (self-hosted), replace the Map with a durable
store: Cloudflare Workers KV / Durable Objects, or Upstash Redis sliding
window. Keep the same `rateLimit` / `strictRateLimit` middleware signatures so
routes don't change.

## Verification

- `DISABLE_RATE_LIMIT=1` bypasses only under `NODE_ENV=test` or `VITEST`.
- Client IP uses `cf-connecting-ip` → `x-real-ip`, never `X-Forwarded-For`.
- STK has defense-in-depth: IP strict limit + per-destination-phone 3/hr in
  `subscriptions.ts:checkStkPhoneLimit` + edge rule above.
