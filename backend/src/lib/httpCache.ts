import type { Context } from "hono";

/**
 * Quota guard: mark anonymous-safe GET responses cacheable so browsers and
 * the Cloudflare edge serve repeats without re-running the Worker logic or
 * hitting Supabase (5GB egress free) and third-party subrequests.
 *
 * Only use on responses with no per-user data. Authenticated / user-specific
 * endpoints must stay uncached (or `private`).
 */
export function publicCache(c: Context, maxAgeSeconds = 60, swrSeconds = 300): void {
  c.header("Cache-Control", `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${swrSeconds}`);
}
