export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const SHIPMENT_STATUS = {
  CREATED: "CREATED",
  IN_TRANSIT: "IN_TRANSIT",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;

export const SHIPMENT_STATUSES = Object.values(SHIPMENT_STATUS) as ReadonlyArray<(typeof SHIPMENT_STATUS)[keyof typeof SHIPMENT_STATUS]>;

export const SHIPMENT_TRANSITIONS: Record<(typeof SHIPMENT_STATUS)[keyof typeof SHIPMENT_STATUS], ReadonlyArray<(typeof SHIPMENT_STATUS)[keyof typeof SHIPMENT_STATUS]>> = {
  [SHIPMENT_STATUS.CREATED]: [SHIPMENT_STATUS.IN_TRANSIT, SHIPMENT_STATUS.CANCELLED],
  [SHIPMENT_STATUS.IN_TRANSIT]: [SHIPMENT_STATUS.DELIVERED, SHIPMENT_STATUS.CANCELLED],
  [SHIPMENT_STATUS.DELIVERED]: [],
  [SHIPMENT_STATUS.CANCELLED]: [],
} as const;

export const SHIPMENT_TERMINAL_STATUSES = [
  SHIPMENT_STATUS.DELIVERED,
  SHIPMENT_STATUS.CANCELLED,
] as const;

export const DISPUTE_STATUS = {
  OPEN: "OPEN",
  UNDER_REVIEW: "UNDER_REVIEW",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
} as const;

// ============================================
// Phase 7 Tier 5: Localization & i18n
// ============================================

export const SUPPORTED_LOCALES = {
  EN: "en", // English
  ES: "es", // Spanish
  FR: "fr", // French
  DE: "de", // German
  PT: "pt", // Portuguese
  ZH: "zh", // Chinese (Simplified)
  JA: "ja", // Japanese
  KO: "ko", // Korean
  AR: "ar", // Arabic
  HE: "he", // Hebrew
  RU: "ru", // Russian
  IT: "it", // Italian
} as const;

export const LOCALE_NAMES = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
  ar: "العربية",
  he: "עברית",
  ru: "Русский",
  it: "Italiano",
} as const;

export const RTL_LOCALES = ["ar", "he"] as const;

export const DEFAULT_LOCALE = "en" as const;

export const CURRENCY_CODES = {
  USD: "USD", // US Dollar
  EUR: "EUR", // Euro
  GBP: "GBP", // British Pound
  JPY: "JPY", // Japanese Yen
  CNY: "CNY", // Chinese Yuan
  KRW: "KRW", // South Korean Won
  BRL: "BRL", // Brazilian Real
  MXN: "MXN", // Mexican Peso
  CAD: "CAD", // Canadian Dollar
  AUD: "AUD", // Australian Dollar
  INR: "INR", // Indian Rupee
  RUB: "RUB", // Russian Ruble
  AED: "AED", // UAE Dirham
  SAR: "SAR", // Saudi Riyal
  ILS: "ILS", // Israeli Shekel
} as const;

export const LOCALE_TO_CURRENCY: Record<string, string> = {
  en: "USD",
  es: "EUR",
  fr: "EUR",
  de: "EUR",
  pt: "BRL",
  zh: "CNY",
  ja: "JPY",
  ko: "KRW",
  ar: "SAR",
  he: "ILS",
  ru: "RUB",
  it: "EUR",
} as const;

export const TIMEZONE_BY_LOCALE: Record<string, string> = {
  en: "America/New_York",
  es: "Europe/Madrid",
  fr: "Europe/Paris",
  de: "Europe/Berlin",
  pt: "America/Sao_Paulo",
  zh: "Asia/Shanghai",
  ja: "Asia/Tokyo",
  ko: "Asia/Seoul",
  ar: "Asia/Riyadh",
  he: "Asia/Jerusalem",
  ru: "Europe/Moscow",
  it: "Europe/Rome",
} as const;
