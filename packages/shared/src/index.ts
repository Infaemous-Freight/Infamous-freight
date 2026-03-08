export * from "./types";
export * from "./zod";
export * from "./api-client";

export type Scope =
  | "load.read"
  | "load.create"
  | "dispatch.recommend"
  | "dispatch.assign"
  | "anomaly.evaluate"
  | "audit.read";

export type JwtClaims = {
  sub: string;
  email: string;
  organizationId: string;
  role: "SUPER_ADMIN" | "ORG_ADMIN" | "DISPATCHER" | "DRIVER" | "ANALYST";
  scopes: Scope[];
};

export type ApiResponse<T> = {
  data: T;
  requestId?: string;
};

export type LoadStatus =
  | "CREATED"
  | "ASSIGNED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "EXCEPTION";

export type TrailerType = "DRY_VAN" | "REEFER" | "FLATBED" | "POWER_ONLY";

export type LoadDto = {
  id: string;
  referenceNumber: string;
  status: LoadStatus;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  deliveryDeadline: string;
  weightLbs: number;
  hazmat: boolean;
  trailerType: TrailerType;
  driverId?: string | null;
  carrierId?: string | null;
};

export type DispatchRecommendationDto = {
  driverId: string;
  totalScore: number;
  deadheadDistanceMi: number;
  routeDistanceMi: number;
  estimatedArrival: string;
  reasons: string[];
};
