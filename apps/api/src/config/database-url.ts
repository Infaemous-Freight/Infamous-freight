const VALID_DB_PROTOCOLS = new Set(["postgres:", "postgresql:"]);

export function isValidDatabaseUrl(value: string): boolean {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);

    if (!VALID_DB_PROTOCOLS.has(parsed.protocol)) {
      return false;
    }

    if (!parsed.hostname || !parsed.pathname || parsed.pathname === "/") {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
