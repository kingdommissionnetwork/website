import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import CredentialVerifyPage from "../pages/CredentialVerifyPage";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { api } from "../lib/api";

vi.mock("../lib/api", () => ({
  api: {
    verifyCredential: vi.fn(),
  },
}));

const mockedVerify = vi.mocked(api.verifyCredential);
const token = "a".repeat(48);

function renderAt(tokenValue: string) {
  return render(
    <MemoryRouter initialEntries={[`/v/${tokenValue}`]}>
      <Routes>
        <Route path="/v/:token" element={<CredentialVerifyPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("CredentialVerifyPage (/v/:token QR deep link)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens holder details directly with no form or code entry", async () => {
    mockedVerify.mockResolvedValue({
      verified: true,
      type: "credential",
      name: "Abazion Partner",
      tier: "Global Harvest Partner",
      status: "Active",
      partnerNumber: "KMN-P-2026/4002",
      validThrough: "2026-03-01T09:00:00Z",
    });
    renderAt(token);
    expect(await screen.findByText("Abazion Partner")).toBeDefined();
    expect(screen.getByText("Global Harvest Partner")).toBeDefined();
    expect(screen.getByText("KMN-P-2026/4002")).toBeDefined();
    expect(screen.queryByPlaceholderText(/code/i)).toBeNull();
    expect(mockedVerify).toHaveBeenCalledWith(token);
  });

  it("shows an invalid state with manual-verify path for bad links", async () => {
    mockedVerify.mockResolvedValue({ verified: false, error: "Credential not found." });
    renderAt(token);
    expect(await screen.findByText(/Credential Not Verified/i)).toBeDefined();
    expect(screen.getByText(/Manual Verification/i)).toBeDefined();
  });
});
