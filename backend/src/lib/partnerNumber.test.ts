import { expect, test, describe, vi } from "vitest";
import {
  formatPartnerNumber,
  parsePartnerNumber,
  randomVerifyToken,
  isValidVerifyToken,
  issuePartnerNumber,
} from "./partnerNumber";

describe("partner credential numbers (KMN-P-2026/4002)", () => {
  test("formats category, year, and zero-padded serial", () => {
    expect(formatPartnerNumber("P", 2026, 4002)).toBe("KMN-P-2026/4002");
    expect(formatPartnerNumber("p", 2026, 41)).toBe("KMN-P-2026/0041");
  });

  test("parses valid numbers and rejects malformed ones", () => {
    expect(parsePartnerNumber("KMN-P-2026/4002")).toEqual({ category: "P", year: 2026, serial: 4002 });
    expect(parsePartnerNumber("kmn-p-2026/4002")).toEqual({ category: "P", year: 2026, serial: 4002 });
    expect(parsePartnerNumber("HKN-KMN-2026")).toBeNull();
    expect(parsePartnerNumber("KMN-P-2026/ABC")).toBeNull();
    expect(parsePartnerNumber("KMN-P-26/4002")).toBeNull();
    expect(parsePartnerNumber("")).toBeNull();
  });

  test("verify tokens are 48 hex chars and unique per call", () => {
    const a = randomVerifyToken();
    const b = randomVerifyToken();
    expect(a).toMatch(/^[0-9a-f]{48}$/);
    expect(b).toMatch(/^[0-9a-f]{48}$/);
    expect(a).not.toBe(b);
    expect(isValidVerifyToken(a)).toBe(true);
    expect(isValidVerifyToken("short")).toBe(false);
    expect(isValidVerifyToken("KMN-P-2026/4002")).toBe(false);
  });

  test("issuePartnerNumber formats the RPC-allocated serial", async () => {
    const db = { rpc: vi.fn(async () => ({ data: 4002, error: null })) };
    await expect(issuePartnerNumber(db, { category: "P", year: 2026 })).resolves.toBe("KMN-P-2026/4002");
    expect(db.rpc).toHaveBeenCalledWith("next_partner_serial", { p_category: "P", p_year: 2026 });
  });

  test("issuePartnerNumber degrades to null when the counter is unavailable", async () => {
    const errDb = { rpc: vi.fn(async () => ({ data: null, error: { message: "function does not exist" } })) };
    await expect(issuePartnerNumber(errDb, {})).resolves.toBeNull();
    const throwDb = { rpc: vi.fn(async () => { throw new Error("offline"); }) };
    await expect(issuePartnerNumber(throwDb, {})).resolves.toBeNull();
  });
});
