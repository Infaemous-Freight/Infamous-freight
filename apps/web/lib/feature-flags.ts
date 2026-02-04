export function isGetTrucknEnabled(): boolean {
  const flag =
    process.env.NEXT_PUBLIC_FEATURE_GET_TRUCKN ??
    process.env.FEATURE_GET_TRUCKN ??
    "true";
  return String(flag).toLowerCase() === "true";
}
