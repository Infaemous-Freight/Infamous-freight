export const ENTERPRISE_DEFAULTS = {
  plan_key: "fleet",
  seats: 1,
  ai_included: 500,
  ai_overage: 0.008,
  ai_hard_cap_multiplier: 2,
} as const;

export function utcMonthKey(d = new Date()) {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
