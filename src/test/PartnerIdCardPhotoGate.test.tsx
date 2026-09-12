import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PartnerIdCard from "../components/PartnerIdCard";
import { printPartnerIdCard } from "../lib/printEngine";

vi.mock("../lib/printEngine", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../lib/printEngine")>();
  return { ...mod, printPartnerIdCard: vi.fn(async () => {}) };
});

const mockedPrint = vi.mocked(printPartnerIdCard);

const card = {
  id: "KMN-P-2026/4002",
  name: "Abazion Partner",
  email: "abazion230@gmail.com",
  role: "Global Harvest Partner",
  planName: "Global Harvest Partner",
  subscriptionStatus: "active",
  joinedAt: "2026",
  partnerNumber: "KMN-P-2026/4002",
};

describe("PartnerIdCard passport-photo gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("blocks printing without a passport photo and shows the requirement", async () => {
    render(<PartnerIdCard card={card} />);
    // Switch to print preview to surface the banner.
    fireEvent.click(screen.getByRole("button", { name: /Print Preview/i }));
    expect(await screen.findByText(/Passport photo required before printing/i)).toBeDefined();
    fireEvent.click(screen.getByText(/Print Official Credential Badge/i));
    await waitFor(() => expect(mockedPrint).not.toHaveBeenCalled());
  });

  it("prints once a passport photo is on file", async () => {
    localStorage.setItem("kmn_partner_photo_kmn-p-2026/4002", "data:image/png;base64,iVBORw0KGgo=");
    render(<PartnerIdCard card={card} />);
    fireEvent.click(screen.getByText(/Print Official Credential Badge/i));
    await waitFor(() => expect(mockedPrint).toHaveBeenCalledTimes(1));
    const payload = mockedPrint.mock.calls[0][0] as { photoUrl?: string };
    expect(payload.photoUrl).toContain("data:image/png;base64");
  });
});
