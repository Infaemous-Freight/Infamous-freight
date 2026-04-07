// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SignInPage from "../pages/auth/sign-in";

const push = vi.fn();
const signInWithPassword = vi.fn();

vi.mock("next/router", () => ({
  useRouter: () => ({ query: {}, push }),
}));

vi.mock("next/head", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock("../src/lib/supabase/browser", () => ({
  supabaseBrowser: () => ({
    auth: {
      signInWithPassword,
      signInWithOAuth: vi.fn(),
    },
  }),
}));

vi.mock("../src/lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

describe("auth sign-in page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders sign-in form", () => {
    render(<SignInPage />);
    expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("shows auth error from API response", async () => {
    signInWithPassword.mockResolvedValueOnce({ data: { user: null }, error: { message: "Invalid login" } });

    render(<SignInPage />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ops@tenant.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "bad-pass" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid login")).toBeInTheDocument();
    });
  });

  it("navigates to dashboard on successful sign-in", async () => {
    signInWithPassword.mockResolvedValueOnce({ data: { user: { id: "u_1" } }, error: null });

    render(<SignInPage />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ops@tenant.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "correct-pass" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/dashboard");
    });
  });
});
