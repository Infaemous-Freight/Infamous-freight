// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const { apiPostMock } = vi.hoisted(() => ({ apiPostMock: vi.fn() }));

vi.mock("../src/lib/api", () => ({ apiPost: apiPostMock }));

import { AvatarDock } from "../src/components/AvatarDock";

describe("AvatarDock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends tenant-scoped command payload", async () => {
    apiPostMock.mockResolvedValueOnce({ avatarState: "idle", message: "ok", action: null });

    render(<AvatarDock token="jwt-token" tenantId="tenant_abc" />);
    fireEvent.click(screen.getByRole("button", { name: "Track" }));

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledWith("/ai/command", "jwt-token", {
        tenantId: "tenant_abc",
        input: "track shipment",
      });
    });
  });

  it("navigates when API responds with navigate action", async () => {
    apiPostMock.mockResolvedValueOnce({
      avatarState: "thinking",
      message: "Navigating",
      action: { type: "NAVIGATE", payload: { to: "shipments" } },
    });

    const hrefSetter = vi.spyOn(window.location, "href", "set");

    render(<AvatarDock token="jwt-token" tenantId="tenant_abc" />);
    fireEvent.click(screen.getByRole("button", { name: "Track" }));

    await waitFor(() => {
      expect(hrefSetter).toHaveBeenCalledWith("/shipments");
    });
  });
});
