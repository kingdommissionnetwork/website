import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SubscriberDashboard from "../pages/SubscriberDashboard";

vi.mock("../lib/auth", () => ({
  useAuth: () => ({
    user: { id: 2, name: "David Partner", email: "david@covenant.org", role: "member" },
    logout: vi.fn(),
    isAuthenticated: true,
    loading: false,
  }),
}));

vi.mock("../lib/api", () => ({
  api: {
    subscriptions: {
      getStatus: vi.fn().mockResolvedValue({
        hasActiveSubscription: true,
        subscription: {
          status: "active",
          amount: 3000,
          currency: "KES",
          plan_name: "Kingdom Ambassador",
          created_at: "2026-01-01T00:00:00Z",
          current_period_end: "2026-12-31T00:00:00Z",
          payment_provider: "paystack",
          payment_reference: "KMN-SUB-TEST-101",
        },
      }),
    },
    donations: {
      history: vi.fn().mockResolvedValue([
        {
          id: "1",
          amount: 3000,
          currency: "KES",
          donor_name: "David Partner",
          created_at: "2026-08-01T00:00:00Z",
          recurring: true,
          status: "completed",
        },
      ]),
    },
    prayers: {
      submit: vi.fn().mockResolvedValue({ id: "PR-999" }),
    },
  },
}));

describe("SubscriberDashboard", () => {
  it("renders partner identity, active tier, and impact telemetry", async () => {
    render(
      <MemoryRouter>
        <SubscriberDashboard />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Welcome back/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Kingdom Ambassador|Active Covenant/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Your Covenant Legacy/i).length).toBeGreaterThan(0);
  });

  it("switches to the Partner ID Card & Credentials tab", async () => {
    render(
      <MemoryRouter>
        <SubscriberDashboard />
      </MemoryRouter>
    );

    const credButtons = screen.getAllByRole("button", { name: /Partner ID & Seal|Partner Credential/i });
    expect(credButtons.length).toBeGreaterThan(0);
    fireEvent.click(credButtons[0]);

    expect(screen.getAllByText(/Official Partner Credential|KINGDOM MISSIONS NETWORK/i).length).toBeGreaterThan(0);
  });

  it("allows navigation to 24/7 Prayer Altar tab", async () => {
    render(
      <MemoryRouter>
        <SubscriberDashboard />
      </MemoryRouter>
    );

    const prayerTabBtn = screen.getByRole("button", { name: /24\/7 Prayer Altar/i });
    fireEvent.click(prayerTabBtn);

    expect(screen.getAllByText(/Priority Pastoral Prayer Altar/i).length).toBeGreaterThan(0);
  });
});
