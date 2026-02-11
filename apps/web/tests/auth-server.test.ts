import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();
const profileMaybeSingleMock = vi.fn();
const usersMaybeSingleMock = vi.fn();
const profilesUpsertMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabaseAnon: {
    auth: {
      getUser: getUserMock,
    },
  },
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: profileMaybeSingleMock,
            })),
          })),
          upsert: profilesUpsertMock,
        };
      }

      if (table === "users") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: usersMaybeSingleMock,
            })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  },
}));

import { AuthError, requireActiveCompany, requireUser } from "@/lib/auth-server";

describe("auth-server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profilesUpsertMock.mockResolvedValue({ error: null });
  });

  it("returns 401 when Authorization bearer token is missing", async () => {
    const req = new Request("https://example.com/api/loads");

    await expect(requireUser(req)).rejects.toMatchObject<AuthError>({
      status: 401,
      message: "Authentication required",
    });
  });

  it("returns 401 for invalid tokens", async () => {
    const req = new Request("https://example.com/api/loads", {
      headers: { authorization: "Bearer bad-token" },
    });

    getUserMock.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "JWT expired" },
    });

    await expect(requireUser(req)).rejects.toMatchObject<AuthError>({
      status: 401,
      message: "Invalid or expired token",
    });
  });

  it("returns 403 when the user has no active company", async () => {
    const req = new Request("https://example.com/api/loads", {
      headers: { authorization: "Bearer valid-token" },
    });

    getUserMock.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    profileMaybeSingleMock.mockResolvedValueOnce({
      data: { active_company_id: null },
    });
    usersMaybeSingleMock.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await expect(requireActiveCompany(req)).rejects.toMatchObject<AuthError>({
      status: 403,
      message: "No active company membership",
    });
  });
});
