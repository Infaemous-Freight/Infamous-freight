import type { TrailerType } from "@prisma/client";

export type DriverCandidate = {
  id: string;
  name: string;
  currentLat: number | null;
  currentLng: number | null;
  hoursRemaining: number;
  trailerType: TrailerType;
  hazmatCertified: boolean;
  truck: {
    id: string;
    maxWeightLbs: number;
    trailerType: TrailerType;
    active: boolean;
  } | null;
};

export type LoadCandidate = {
  id: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  pickupWindowStart: Date;
  pickupWindowEnd: Date;
  deliveryDeadline: Date;
  weightLbs: number;
  hazmat: boolean;
  trailerType: TrailerType;
};

export type DispatchScore = {
  driverId: string;
  totalScore: number;
  deadheadDistanceMi: number;
  routeDistanceMi: number;
  estimatedArrival: Date;
  reasons: string[];
};
