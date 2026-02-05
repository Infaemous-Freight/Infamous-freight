export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function percent(used: number, included: number) {
  if (included <= 0) return 0;
  return used / included;
}

export function formatNumber(n: number) {
  return n.toLocaleString("en-US");
}
