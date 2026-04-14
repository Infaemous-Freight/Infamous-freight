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
  trackingId: string;
  userId: ID;
  driverId?: ID;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  reference?: string;
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

export interface User extends TenantScoped {
  id: ID;
  email: string;
  name?: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Carrier extends TenantScoped {
  id: ID;
  name: string;
  mcNumber?: string;
  dotNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice extends TenantScoped {
  id: ID;
  loadId: ID;
  amountCents: number;
  status: "DRAFT" | "SENT" | "PAID" | "VOID";
  createdAt: string;
  updatedAt: string;
}

export interface DriverProfile extends TenantScoped {
  id: ID;
  userId: ID;
  licenseNumber?: string;
  vehicleType?: string;
  availabilityStatus: "AVAILABLE" | "ON_LOAD" | "OFF_DUTY";
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponseShape<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiResponse<T = unknown> implements ApiResponseShape<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;

  constructor(shape: ApiResponseShape<T>) {
    this.success = shape.success;
    this.data = shape.data;
    this.error = shape.error;
    this.message = shape.message;
  }
}
