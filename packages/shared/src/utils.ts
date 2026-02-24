export function validateNonEmpty(value: string, field = "value"): void {
  if (!value || !value.trim()) throw new Error(`${field} must be non-empty`);
}

export function nowIso(): string {
  return new Date().toISOString();
}

// ============================================
// Phase 7 Tier 5: Localization Utilities
// ============================================

/**
 * Format currency based on locale and currency code
 * @param amount - Amount in cents/smallest unit
 * @param locale - BCP 47 language tag (e.g., 'en-US', 'fr-FR')
 * @param currency - ISO 4217 currency code (e.g., 'USD', 'EUR')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  locale: string = "en-US",
  currency: string = "USD",
): string {
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount / 100); // Convert cents to dollars
  } catch (error) {
    // Fallback for invalid locale/currency
    return `${currency} ${(amount / 100).toFixed(2)}`;
  }
}

/**
 * Format date based on locale and timezone
 * @param date - Date object or ISO string
 * @param locale - BCP 47 language tag
 * @param timezone - IANA timezone identifier
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  locale: string = "en-US",
  timezone: string = "America/New_York",
  options?: Intl.DateTimeFormatOptions,
): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: timezone,
      ...options,
    };
    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch (error) {
    return String(date);
  }
}

/**
 * Format date and time based on locale and timezone
 * @param date - Date object or ISO string
 * @param locale - BCP 47 language tag
 * @param timezone - IANA timezone identifier
 * @returns Formatted date-time string
 */
export function formatDateTime(
  date: Date | string,
  locale: string = "en-US",
  timezone: string = "America/New_York",
): string {
  return formatDate(date, locale, timezone, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format number based on locale
 * @param value - Number to format
 * @param locale - BCP 47 language tag
 * @param options - Intl.NumberFormat options
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  locale: string = "en-US",
  options?: Intl.NumberFormatOptions,
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch (error) {
    return String(value);
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * @param date - Date object or ISO string
 * @param locale - BCP 47 language tag
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: Date | string, locale: string = "en-US"): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    const diffSeconds = Math.round(diffMs / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

    if (Math.abs(diffSeconds) < 60) {
      return rtf.format(diffSeconds, "second");
    } else if (Math.abs(diffMinutes) < 60) {
      return rtf.format(diffMinutes, "minute");
    } else if (Math.abs(diffHours) < 24) {
      return rtf.format(diffHours, "hour");
    } else if (Math.abs(diffDays) < 30) {
      return rtf.format(diffDays, "day");
    } else {
      return formatDate(dateObj, locale);
    }
  } catch (error) {
    return String(date);
  }
}

/**
 * Get locale from Accept-Language header
 * @param acceptLanguage - Accept-Language header value
 * @param supportedLocales - Array of supported locale codes
 * @param defaultLocale - Fallback locale
 * @returns Best matching locale
 */
export function parseAcceptLanguage(
  acceptLanguage: string | undefined,
  supportedLocales: readonly string[],
  defaultLocale: string = "en",
): string {
  if (!acceptLanguage) return defaultLocale;

  // Parse Accept-Language header (e.g., "en-US,en;q=0.9,fr;q=0.8")
  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const parts = lang.trim().split(";");
      const code = parts[0].split("-")[0]; // Extract language code (ignore region)
      const qMatch = parts[1]?.match(/q=([0-9.]+)/);
      const quality = qMatch ? parseFloat(qMatch[1]) : 1.0;
      return { code, quality };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find first supported language
  for (const lang of languages) {
    if (supportedLocales.includes(lang.code)) {
      return lang.code;
    }
  }

  return defaultLocale;
}
