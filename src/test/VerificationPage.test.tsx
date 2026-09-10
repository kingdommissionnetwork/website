import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import VerificationPage from "../pages/VerificationPage";
import { MemoryRouter } from "react-router-dom";

vi.mock("../lib/api", () => ({
  api: {
    verifyDocument: vi.fn().mockImplementation(async (params) => {
      if (params.ref || params.inv) {
        return {
          verified: true,
          type: "invoice",
          reference: params.ref || "RTY54EW23R",
          invoiceNumber: params.inv || "KMN-REC-16",
          amount: 5000,
          currency: "KES",
          donorName: "Kingdom Covenant Sower",
          status: "completed",
          date: "2026-09-10T00:00:00.000Z",
          verifiedAt: "2026-09-10T05:00:00.000Z",
          provider: "Paystack / M-Pesa",
        };
      }
      return { verified: false };
    }),
  },
}));

describe("VerificationPage", () => {
  it("renders manual lookup input when no query parameters are provided", async () => {
    render(
      <MemoryRouter initialEntries={["/verify"]}>
        <VerificationPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Verify Official Ministry Records/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/e\.g\. KMN-REC-16 or RTY54EW23R/i)).toBeDefined();
  });

  it("authenticates and displays invoice details with URL parameters", async () => {
    render(
      <MemoryRouter initialEntries={["/verify?doc=invoice&ref=RTY54EW23R&inv=KMN-REC-16"]}>
        <VerificationPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/AUTHENTIC & VERIFIED/i)).toBeDefined();
    expect(screen.getByText(/KMN-REC-16/i)).toBeDefined();
    expect(screen.getByText(/RTY54EW23R/i)).toBeDefined();
    expect(screen.getByText(/Print Official Receipt/i)).toBeDefined();
  });
});
