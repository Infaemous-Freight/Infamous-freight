import { describe, expect, it } from "vitest";
import { getAbVariant, shouldSetAbVariantCookie } from "../src/lib/ab-variant";

describe("getAbVariant", () => {
  it("prefers query param over cookie value", () => {
    const searchParams = new URLSearchParams("variant=Treatment_A");
    expect(getAbVariant(searchParams, "control")).toBe("Treatment_A");
  });

  it("falls back to cookie value when query param is missing", () => {
    const searchParams = new URLSearchParams();
    expect(getAbVariant(searchParams, "CONTROL_GROUP")).toBe("CONTROL_GROUP");
  });

  it("trims values before validation", () => {
    const searchParams = new URLSearchParams("variant=%20variant-1%20");
    expect(getAbVariant(searchParams, undefined)).toBe("variant-1");
  });

  it("falls back to cookie when query value is invalid", () => {
    const searchParams = new URLSearchParams("variant=<script>alert(1)</script>");
    expect(getAbVariant(searchParams, "cookie")).toBe("cookie");
  });

  it("falls back to valid cookie when query param is invalid", () => {
    const searchParams = new URLSearchParams("variant=<invalid>");
    expect(getAbVariant(searchParams, "control-group")).toBe("control-group");
  });

  it("returns undefined when both query param and cookie are invalid", () => {
    const searchParams = new URLSearchParams("variant=<invalid>");
    expect(getAbVariant(searchParams, "bad value")).toBeUndefined();
  });

  it("returns undefined for variants longer than 64 chars", () => {
    const longVariant = "a".repeat(65);
    const searchParams = new URLSearchParams(`variant=${longVariant}`);
    expect(getAbVariant(searchParams, undefined)).toBeUndefined();
  });

  it("rejects values containing disallowed punctuation", () => {
    const searchParams = new URLSearchParams("variant=variant.v2");
    expect(getAbVariant(searchParams, undefined)).toBeUndefined();
  });
});

describe("shouldSetAbVariantCookie", () => {
  it("returns true when resolved variant exists and differs from existing cookie", () => {
    expect(shouldSetAbVariantCookie("control", "treatment")).toBe(true);
  });

  it("returns false when resolved variant matches existing cookie", () => {
    expect(shouldSetAbVariantCookie("control", "control")).toBe(false);
  });

  it("returns false when resolved variant is undefined", () => {
    expect(shouldSetAbVariantCookie("control", undefined)).toBe(false);
  });
});
