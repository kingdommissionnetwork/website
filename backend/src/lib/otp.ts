/**
 * Kingdom Missions Network — one-time passcode (OTP) helpers for
 * progressive-identity account claiming.
 *
 * Flow: payment succeeds as guest → server stores only a SHA-256 hash of a
 * 6-digit code (never the code) in `subscriber_otps` → code emailed to the
 * payer → payer proves inbox ownership → server mints the session.
 * Codes live 10 minutes, max 5 verification attempts, single-use.
 */

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_LENGTH = 6;

export function generateOtpCode(): string {
  const buf = new Uint32Array(OTP_LENGTH);
  crypto.getRandomValues(buf);
  return Array.from(buf)
    .map((n) => String(n % 10))
    .join("");
}

export async function hashOtpCode(code: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`kmn-otp:${code.trim()}`));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyOtpCode(code: string, expectedHash: string): Promise<boolean> {
  const actual = await hashOtpCode(code);
  if (actual.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) {
    diff |= actual.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return diff === 0;
}
