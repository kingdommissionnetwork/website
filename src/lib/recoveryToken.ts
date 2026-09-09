/**
 * Utility functions for parsing Supabase recovery tokens from the URL.
 *
 * Supabase recovery links land in one of two shapes:
 *   - Implicit flow: /reset-password#access_token=...&type=recovery
 *   - Query flow:    /reset-password?token=... (or ?access_token=...)
 * The fragment never reaches the server, so it must be read client-side.
 */

export function extractRecoveryToken(hash: string, search: string): string | null {
  const fromHash = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const hashToken = fromHash.get("access_token");
  if (hashToken) return hashToken;
  const fromQuery = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return fromQuery.get("access_token") || fromQuery.get("token");
}

export function extractRecoveryError(hash: string, search: string): string | null {
  const fromHash = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const err = fromHash.get("error_description") || fromHash.get("error");
  if (err) return err;
  const fromQuery = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return fromQuery.get("error_description") || fromQuery.get("error");
}
