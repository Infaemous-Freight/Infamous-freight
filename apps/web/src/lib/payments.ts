import { getPaymentLink, type PaymentLinkType } from "@infamous-freight/shared";

export function openPayment(type: PaymentLinkType): void {
  const url = getPaymentLink(type);

  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
