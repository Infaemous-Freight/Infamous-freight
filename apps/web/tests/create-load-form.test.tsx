// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CreateLoadForm from "../src/components/CreateLoadForm";

const push = vi.fn();
const getUser = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("../src/lib/supabase/browser", () => ({
  supabaseBrowser: () => ({
    auth: { getUser },
    from: () => ({
      insert: () => ({
        select: () => ({
          single: vi.fn(),
        }),
      }),
    }),
  }),
}));

describe("CreateLoadForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders status selector with default option", () => {
    render(<CreateLoadForm />);
    const statusSelect = screen.getByLabelText("Status") as HTMLSelectElement;
    expect(statusSelect.value).toBe("open");
  });

  it("shows validation error when user is not authenticated", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } });

    render(<CreateLoadForm />);
    fireEvent.click(screen.getByRole("button", { name: "Create Load" }));

    await waitFor(() => {
      expect(screen.getByText("Not signed in")).toBeInTheDocument();
    });
    expect(push).not.toHaveBeenCalled();
  });
});
