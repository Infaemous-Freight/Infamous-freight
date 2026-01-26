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

export enum PaymentEventType {
  CHARGEBACK = "CHARGEBACK",
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
