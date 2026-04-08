const getRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required payment link environment variable: ${name}`);
  }
  return value;
};

export const PAYMENT_LINKS = {
  get BOOKING() {
    return getRequiredEnv("NEXT_PUBLIC_PAYMENT_LINK_BOOKING");
  },
  get DISPATCH() {
    return getRequiredEnv("NEXT_PUBLIC_PAYMENT_LINK_DISPATCH");
  },
  get RESERVATION() {
    return getRequiredEnv("NEXT_PUBLIC_PAYMENT_LINK_RESERVATION");
  },
  get PREMIUM() {
    return getRequiredEnv("NEXT_PUBLIC_PAYMENT_LINK_PREMIUM");
  },
} as const;

export type PaymentLinkType = keyof typeof PAYMENT_LINKS;
