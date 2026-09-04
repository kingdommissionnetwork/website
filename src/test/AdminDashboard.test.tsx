import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminDashboard from "../pages/AdminDashboard";

vi.mock("../lib/auth", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Admin", email: "admin@test.com", role: "admin" },
    loading: false,
  }),
}));

vi.mock("../hooks/use-async", () => ({
  useAsync: () => ({
    data: {
      totalUsers: 10,
      totalPrayers: 20,
      pendingPrayers: 5,
      totalSermons: 15,
      monthlyGiving: 1000,
      activeEvents: 3,
      totalYtd: 12000,
      donorCount: 50,
    },
    loading: false,
    error: null,
  }),
}));

import { MemoryRouter } from "react-router-dom";

describe("AdminDashboard", () => {
  it("renders without crashing and displays command center", () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );
    expect(screen.getAllByText(/Command Center|KMN OPERATIONS/i).length).toBeGreaterThan(0);
  });

  it("displays key statistics and attention center", () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );
    expect(screen.getAllByText(/TOTAL REGISTERED MEMBERS|ACTIVE PARTNERS/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Command Center/i).length).toBeGreaterThan(0);
  });
});
