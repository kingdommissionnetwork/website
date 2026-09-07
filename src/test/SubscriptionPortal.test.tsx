import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SubscriptionPortal from "../pages/SubscriptionPortal";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";

vi.mock("../lib/api", () => ({
  api: {
    subscriptions: {
      getPricing: vi.fn().mockResolvedValue({
        planName: "Kingdom Ambassador",
        kesAmount: 3000,
        usdAmount: 23.16,
        exchangeRate: 0.00772,
        interval: "monthly",
        provider: "exchangerate-api",
        description: "Monthly partnership subscription",
      }),
      getStatus: vi.fn().mockResolvedValue({ hasActiveSubscription: false }),
    },
  },
}));

vi.mock("../lib/auth", () => ({
  useAuth: () => ({ user: null, setSession: vi.fn() }),
}));

describe("SubscriptionPortal", () => {
  it("renders partnership packages and partner heading", async () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <SubscriptionPortal />
        </MemoryRouter>
      </HelmetProvider>
    );
    const headings = await screen.findAllByText(/Kingdom Ambassador|Seed Partner|Global Harvest/i);
    expect(headings.length).toBeGreaterThan(0);
    expect(await screen.findByText(/Covenant Partnership/i)).toBeDefined();
  });

  it("renders currency exchange calculation and payment actions", async () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <SubscriptionPortal />
        </MemoryRouter>
      </HelmetProvider>
    );
    const amounts = await screen.findAllByText(/KES/i);
    expect(amounts.length).toBeGreaterThan(0);
    expect(await screen.findByText(/Proceed to Payment/i)).toBeDefined();
  });
});
