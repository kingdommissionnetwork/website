import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminDashboard from "../pages/AdminDashboard";

vi.mock("../lib/auth", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Admin", email: "admin@test.com", role: "admin" },
    loading: false,
  }),
}));


import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../lib/theme";

describe("AdminDashboard", () => {
  it("renders without crashing and displays command center", () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      </ThemeProvider>
    );
    expect(screen.getAllByText(/Command Center|KMN OPERATIONS/i).length).toBeGreaterThan(0);
  });

  it("displays key statistics and attention center", () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      </ThemeProvider>
    );
    expect(screen.getAllByText(/TOTAL REGISTERED MEMBERS|ACTIVE PARTNERS/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Command Center/i).length).toBeGreaterThan(0);
  });
});
