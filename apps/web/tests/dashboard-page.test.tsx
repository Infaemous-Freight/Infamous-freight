// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const { pushMock, routerMock, observeAuthStateMock, listLoadsMock, reportSentryErrorMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  routerMock: { push: vi.fn() },
  observeAuthStateMock: vi.fn(),
  listLoadsMock: vi.fn(),
  reportSentryErrorMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/lib/auth", () => ({
  observeAuthState: observeAuthStateMock,
}));

vi.mock("@/lib/firestoreCrud", () => ({
  listLoads: listLoadsMock,
}));

vi.mock("@/lib/sentry", () => ({
  reportSentryError: reportSentryErrorMock,
}));

import Dashboard from "../app/dashboard/page";

describe("dashboard page", () => {
  beforeEach(() => {
    pushMock.mockReset();
    routerMock.push = pushMock;
    observeAuthStateMock.mockReset();
    listLoadsMock.mockReset();
    reportSentryErrorMock.mockReset();
  });

  it("reports list load failures and shows user-friendly error", async () => {
    observeAuthStateMock.mockImplementation((callback: (user: { uid: string } | null) => void) => {
      void callback({ uid: "user_1" });
      return () => undefined;
    });
    listLoadsMock.mockRejectedValue(new Error("firestore unavailable"));

    render(<Dashboard />);

    await waitFor(() => {
      expect(reportSentryErrorMock).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          contexts: expect.objectContaining({
            component: "dashboard",
            action: "listLoads",
          }),
        }),
      );
    });

    const errorMessage = await screen.findByText("Failed to load dashboard data. Please try again.");

    expect(errorMessage).toBeInTheDocument();
    expect(reportSentryErrorMock).toHaveBeenCalledTimes(1);
  });

  it("redirects unauthenticated users to login", async () => {
    observeAuthStateMock.mockImplementation((callback: (user: null) => void) => {
      void callback(null);
      return () => undefined;
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/login");
    });
  });

  it("clears previously loaded loads when auth becomes unauthenticated", async () => {
    observeAuthStateMock.mockImplementation((callback: (user: { uid: string } | null) => void) => {
      void callback({ uid: "user_1" });
      void callback(null);
      return () => undefined;
    });
    listLoadsMock.mockResolvedValue([{
      id: "load_1",
      lane: "DAL-HOU",
      rateCents: 250000,
      status: "ACTIVE",
    }]);

    render(<Dashboard />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/login");
    });

    expect(screen.queryByText(/DAL-HOU/)).not.toBeInTheDocument();
  });
});
