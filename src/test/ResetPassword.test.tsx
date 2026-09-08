import { describe, it, expect } from "vitest";
import { extractRecoveryToken, extractRecoveryError } from "../pages/ResetPassword";

describe("extractRecoveryToken", () => {
  it("reads access_token from the URL hash (Supabase implicit flow)", () => {
    expect(extractRecoveryToken("#access_token=abc123&type=recovery", "")).toBe("abc123");
  });

  it("falls back to query params (?token=...)", () => {
    expect(extractRecoveryToken("", "?token=xyz")).toBe("xyz");
  });

  it("returns null when no token is present", () => {
    expect(extractRecoveryToken("", "")).toBeNull();
    expect(extractRecoveryToken("#type=recovery", "?foo=bar")).toBeNull();
  });
});

describe("extractRecoveryError", () => {
  it("reads error from the URL hash", () => {
    expect(extractRecoveryError("#error=expired&error_description=Link+expired", "")).toBe(
      "Link expired"
    );
  });

  it("returns null when there is no error", () => {
    expect(extractRecoveryError("#access_token=abc", "")).toBeNull();
  });
});
