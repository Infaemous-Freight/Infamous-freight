import { afterEach, describe, expect, it } from "vitest";
import { getSupabasePublicKey, getSupabasePublicKeyError } from "@/lib/supabase/env";

const ORIGINAL_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ORIGINAL_PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

describe("supabase env helpers", () => {
  afterEach(() => {
    if (ORIGINAL_ANON === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ORIGINAL_ANON;
    }

    if (ORIGINAL_PUBLISHABLE === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = ORIGINAL_PUBLISHABLE;
    }
  });

  it("prefers NEXT_PUBLIC_SUPABASE_ANON_KEY when present", () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";

    expect(getSupabasePublicKey()).toBe("anon-key");
  });

  it("falls back to NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";

    expect(getSupabasePublicKey()).toBe("publishable-key");
  });

  it("returns undefined if neither key is configured", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    expect(getSupabasePublicKey()).toBeUndefined();
  });

  it("builds contextual error text", () => {
    expect(getSupabasePublicKeyError("middleware")).toContain("middleware");
  });
});
