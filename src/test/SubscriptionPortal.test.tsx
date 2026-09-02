import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SubscriptionPortal from "../pages/SubscriptionPortal";
import { HelmetProvider } from "react-helmet-async";

vi.mock("../lib/api", () => ({
  api: {
    subscriptions: {
      getPricing: vi.fn().mockResolvedValue({
        planName: "Kingdom Partner",
        kesAmount: 1000,
        usdAmount: 7.72,
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
  useAuth: () => ({ user: null }),
}));

describe("SubscriptionPortal", () => {
  it("renders partnership packages and partner heading", async () => {
    render(
      <HelmetProvider>
        <SubscriptionPortal />
      </HelmetProvider>
    );
    const headings = await screen.findAllByText(/Kingdom Ambassador|Seed Partner|Global Harvest Partner/i);
    expect(headings.length).toBeGreaterThan(0);
    expect(await screen.findByText(/Kingdom Partner/i)).toBeDefined();
  });

  it("renders live currency exchange calculation and perks", async () => {
    render(
      <HelmetProvider>
        <SubscriptionPortal />
      </HelmetProvider>
    );
    const badges = await screen.findAllByText(/Live Rate/i);
    expect(badges.length).toBeGreaterThan(0);
  });
});
