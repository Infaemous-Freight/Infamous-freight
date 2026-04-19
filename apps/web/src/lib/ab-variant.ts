const AB_VARIANT_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

export function getAbVariant(
  searchParams: URLSearchParams,
  cookieVariant: string | undefined,
): string | undefined {
  const normalize = (value: string | undefined | null): string | undefined => {
    if (!value) return undefined;
    const normalized = value.trim();
    return AB_VARIANT_PATTERN.test(normalized) ? normalized : undefined;
  };

  const queryVariant = normalize(searchParams.get("variant"));
  if (queryVariant) return queryVariant;

  return normalize(cookieVariant);
}

export function shouldSetAbVariantCookie(
  existingCookieVariant: string | undefined,
  resolvedVariant: string | undefined,
): boolean {
  return Boolean(resolvedVariant) && existingCookieVariant !== resolvedVariant;
}
