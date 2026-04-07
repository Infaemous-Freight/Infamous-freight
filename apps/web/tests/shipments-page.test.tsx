// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { apiGetMock } = vi.hoisted(() => ({ apiGetMock: vi.fn() }));

vi.mock("../src/lib/api", () => ({
  apiGet: apiGetMock,
}));

vi.mock("../src/lib/auth", () => ({
  getDemoAuth: () => ({ token: "demo-token", tenantId: "tenant_1" }),
}));

import ShipmentsPage from "../src/app/shipments/page";

describe("shipments page", () => {
  it("renders shipment list from API", async () => {
    apiGetMock.mockResolvedValueOnce({
      data: [
        {
          id: "ship_1",
          ref: "REF-1",
          originCity: "Austin",
          originState: "TX",
          destCity: "Dallas",
          destState: "TX",
          status: "IN_TRANSIT",
        },
      ],
    });

    const ui = await ShipmentsPage();
    render(ui);

    expect(screen.getByRole("heading", { name: "Shipments" })).toBeInTheDocument();
    expect(screen.getByText(/REF-1/)).toBeInTheDocument();
    expect(apiGetMock).toHaveBeenCalledWith("/shipments", "demo-token");
  });
});
