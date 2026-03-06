export type ID = string;

export type Role = "ADMIN" | "OPERATOR" | "CARRIER" | "BROKER" | "SHIPPER";

export type ShipmentStatus =
  | "CREATED"
  | "POSTED"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";

export type LoadStatus = "OPEN" | "CLAIMED" | "ASSIGNED" | "CLOSED";

export type AvatarState = "idle" | "suggesting" | "alert" | "critical";

export interface TenantScoped {
  tenantId: ID;
}

export interface Shipment extends TenantScoped {
  id: ID;
  ref: string;
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  weightLb: number;
  rateCents: number;
  status: ShipmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Load extends TenantScoped {
  id: ID;
  lane: string;
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  distanceMi: number;
  weightLb: number;
  rateCents: number;
  status: LoadStatus;
  claimedByUserId?: ID;
  claimedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AICommandRequest extends TenantScoped {
  input: string;
  context?: Record<string, unknown>;
}

export interface AICommandResponse {
  avatarState: AvatarState;
  action?: { type: string; payload?: Record<string, unknown> };
  message: string;
}
