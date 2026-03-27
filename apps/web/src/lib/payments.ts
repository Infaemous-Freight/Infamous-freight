import { PAYMENT_LINKS, type PaymentLinkType } from "@infamous-freight/shared";

export function openPayment(type: PaymentLinkType): void {
  const url = PAYMENT_LINKS[type];

  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
