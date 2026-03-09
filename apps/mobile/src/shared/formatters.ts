const currencyFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const numberFmt = new Intl.NumberFormat("en-US");

/**
 * Formats a rate stored in cents to a US dollar string.
 *
 * @example formatCents(150000) // "$1,500.00"
 */
export function formatCents(cents: number): string {
  return currencyFmt.format(cents / 100);
}

/**
 * Formats a weight in pounds with locale-aware thousands separators.
 *
 * @example formatWeight(44000) // "44,000 lbs"
 */
export function formatWeight(lbs: number): string {
  return `${numberFmt.format(lbs)} lbs`;
}

/**
 * Formats a distance in miles.
 *
 * @example formatDistance(1234) // "1,234 mi"
 */
export function formatDistance(miles: number): string {
  return `${numberFmt.format(miles)} mi`;
}

/**
 * Returns a human-readable relative time string (e.g. "2 hours ago").
 */
export function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
