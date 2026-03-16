export interface Vehicle {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  status: VehicleStatus;
  currentOdometer: number;
  carrierId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type VehicleStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'DECOMMISSIONED';

export interface FleetTelemetry {
  vehicleId: string;
  lat: number;
  lng: number;
  speedMph: number;
  engineOn: boolean;
  recordedAt: Date;
}
