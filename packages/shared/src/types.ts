export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type ShipmentStatus =
  | 'CREATED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Shipment {
  id: string;
  status: ShipmentStatus;
  origin: string;
  destination: string;
  weightKg: number;
  createdAt: string;
}

// Central enum for all payment-related events. Extend this as new
// payment event types are introduced (e.g., when adding new webhooks).
export enum PaymentEventType {
  CHARGEBACK = "CHARGEBACK",
  REFUND = "REFUND",
  PAYMENT_SUCCEEDED = "PAYMENT_SUCCEEDED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
}

export interface ChargebackPayload {
  reason: string;
  [key: string]: unknown;
}

export type PaymentEvent =
  | {
      id: string;
      type: PaymentEventType.CHARGEBACK;
      userId: string;
      payload: ChargebackPayload;
    };
