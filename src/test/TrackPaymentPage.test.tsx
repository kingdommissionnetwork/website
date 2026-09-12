import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TrackPaymentPage from "../pages/TrackPaymentPage";
import { MemoryRouter } from "react-router-dom";
import { api } from "../lib/api";

vi.mock("../lib/api", () => ({
  api: {
    subscriptions: {
      getClaimStatus: vi.fn(),
      requestClaim: vi.fn(),
      verifyClaim: vi.fn(),
    },
  },
  normalizeAuthUser: (u: unknown) => u,
}));

const mockedStatus = vi.mocked(api.subscriptions.getClaimStatus);

describe("TrackPaymentPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the lookup form with safe-to-close guidance", () => {
    render(
      <MemoryRouter initialEntries={["/track"]}>
        <TrackPaymentPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Track My Payment/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/TK78AB12CD/i)).toBeDefined();
    expect(screen.getByText(/Closed the page after paying\?/i)).toBeDefined();
  });

  it("validates empty lookup input without calling the API", async () => {
    render(
      <MemoryRouter initialEntries={["/track"]}>
        <TrackPaymentPage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText(/Check Payment Status/i));
    expect(await screen.findByText(/10-character M-Pesa/i)).toBeDefined();
    expect(mockedStatus).not.toHaveBeenCalled();
  });

  it("shows the pending timeline and safe-to-close message for awaiting claims", async () => {
    mockedStatus.mockResolvedValue({ status: "awaiting_receipt", claim: { payment_reference: "TK78AB12CD" } });
    render(
      <MemoryRouter initialEntries={["/track"]}>
        <TrackPaymentPage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText(/TK78AB12CD/i), { target: { value: "TK78AB12CD" } });
    fireEvent.change(screen.getByPlaceholderText(/your.email@example.com/i), { target: { value: "jane@example.com" } });
    fireEvent.click(screen.getByText(/Check Payment Status/i));
    expect(await screen.findByText(/in the verification queue/i)).toBeDefined();
    expect(screen.getByText(/safely close this page/i)).toBeDefined();
  });

  it("shows the approved state with a hub-claim action for matched claims", async () => {
    mockedStatus.mockResolvedValue({
      status: "matched",
      claim: { payment_reference: "TK78AB12CD" },
      subscription: { plan_name: "Kingdom Ambassador" },
    });
    render(
      <MemoryRouter initialEntries={["/track"]}>
        <TrackPaymentPage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText(/TK78AB12CD/i), { target: { value: "TK78AB12CD" } });
    fireEvent.change(screen.getByPlaceholderText(/your.email@example.com/i), { target: { value: "jane@example.com" } });
    fireEvent.click(screen.getByText(/Check Payment Status/i));
    expect(await screen.findByText(/Your receipt was emailed/i)).toBeDefined();
    expect(screen.getByText(/Claim My Partner Hub/i)).toBeDefined();
  });

  it("treats legacy approved rows as matched", async () => {
    mockedStatus.mockResolvedValue({
      status: "approved",
      claim: { payment_reference: "TK78AB12CD" },
      subscription: { plan_name: "Kingdom Ambassador" },
    });
    render(
      <MemoryRouter initialEntries={["/track"]}>
        <TrackPaymentPage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText(/TK78AB12CD/i), { target: { value: "TK78AB12CD" } });
    fireEvent.change(screen.getByPlaceholderText(/your.email@example.com/i), { target: { value: "jane@example.com" } });
    fireEvent.click(screen.getByText(/Check Payment Status/i));
    expect(await screen.findByText(/Your receipt was emailed/i)).toBeDefined();
    expect(screen.getByText(/Claim My Partner Hub/i)).toBeDefined();
  });

  it("shows rejection reason with resubmit path for rejected claims", async () => {
    mockedStatus.mockResolvedValue({
      status: "rejected",
      claim: { payment_reference: "TK78AB12CD", note: "Code not found on statement" },
    });
    render(
      <MemoryRouter initialEntries={["/track"]}>
        <TrackPaymentPage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText(/TK78AB12CD/i), { target: { value: "TK78AB12CD" } });
    fireEvent.change(screen.getByPlaceholderText(/your.email@example.com/i), { target: { value: "jane@example.com" } });
    fireEvent.click(screen.getByText(/Check Payment Status/i));
    expect(await screen.findByText(/Code not found on statement/i)).toBeDefined();
    expect(screen.getByText(/Resubmit Payment/i)).toBeDefined();
  });

  it("prefills lookup from deep-link query params", async () => {
    mockedStatus.mockResolvedValue({ status: "awaiting_receipt", claim: {} });
    render(
      <MemoryRouter initialEntries={["/track?ref=TK78AB12CD&email=jane%40example.com"]}>
        <TrackPaymentPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockedStatus).toHaveBeenCalledWith("TK78AB12CD", "jane@example.com"));
  });
});
