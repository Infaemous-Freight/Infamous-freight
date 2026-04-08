const PAYMENT_LINK_ENV_BY_TYPE = {
  BOOKING: "NEXT_PUBLIC_PAYMENT_LINK_BOOKING",
  DISPATCH: "NEXT_PUBLIC_PAYMENT_LINK_DISPATCH",
  RESERVATION: "NEXT_PUBLIC_PAYMENT_LINK_RESERVATION",
  PREMIUM: "NEXT_PUBLIC_PAYMENT_LINK_PREMIUM",
} as const;

export type PaymentLinkType = keyof typeof PAYMENT_LINK_ENV_BY_TYPE;

type PaymentLinkMap = Record<PaymentLinkType, string | undefined>;

const readEnv = (name: string): string | undefined => {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
};

export const PAYMENT_LINKS: PaymentLinkMap = {
  BOOKING: readEnv(PAYMENT_LINK_ENV_BY_TYPE.BOOKING),
  DISPATCH: readEnv(PAYMENT_LINK_ENV_BY_TYPE.DISPATCH),
  RESERVATION: readEnv(PAYMENT_LINK_ENV_BY_TYPE.RESERVATION),
  PREMIUM: readEnv(PAYMENT_LINK_ENV_BY_TYPE.PREMIUM),
};

export const getPaymentLink = (type: PaymentLinkType): string => {
  const link = PAYMENT_LINKS[type];
  if (!link) {
    throw new Error(
      `Missing required payment link environment variable: ${PAYMENT_LINK_ENV_BY_TYPE[type]}`,
    );
  }

  return link;
};
