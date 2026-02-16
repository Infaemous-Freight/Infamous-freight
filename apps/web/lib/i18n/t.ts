import type { Locale } from "./dict";
import { dict } from "./dict";

export function getLocaleFromRouter(locale: string | undefined): Locale {
  return locale === "es" ? "es" : "en";
}

// Tiny dot-notation getter
export function t(locale: Locale, key: string): string {
  const parts = key.split(".");
  let cur: unknown = dict[locale];

  for (const p of parts) {
    if (typeof cur !== "object" || cur === null) return key;
    const record = cur as Record<string, unknown>;
    cur = record[p];
    if (cur === null || cur === undefined) return key;
  }
  return typeof cur === "string" ? cur : key;
}

/** Locale-aware formatting helpers (global-friendly) */
export function formatCurrency(locale: Locale, amount: number, currency: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDateTime(locale: Locale, d: Date, timeZone?: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timeZone || undefined,
  }).format(d);
}
