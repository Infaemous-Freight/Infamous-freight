const getPaymentEnv = (name: string): string => {
  const value = process.env[name];
  return typeof value === "string" ? value : "";
};

export const PAYMENT_LINKS = {
  BOOKING: getPaymentEnv("NEXT_PUBLIC_PAYMENT_LINK_BOOKING"),
  DISPATCH: getPaymentEnv("NEXT_PUBLIC_PAYMENT_LINK_DISPATCH"),
  RESERVATION: getPaymentEnv("NEXT_PUBLIC_PAYMENT_LINK_RESERVATION"),
  PREMIUM: getPaymentEnv("NEXT_PUBLIC_PAYMENT_LINK_PREMIUM"),
} as const;

export type PaymentLinkType = keyof typeof PAYMENT_LINKS;
