export interface Driver {
  id: string;
  userId: string;
  cdlNumber: string;
  cdlExpiry: Date;
  carrierId: string;
  status: DriverStatus;
  currentVehicleId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type DriverStatus = 'AVAILABLE' | 'ON_DUTY' | 'OFF_DUTY' | 'SUSPENDED';

export interface DriverCoachingEvent {
  id: string;
  driverId: string;
  category: 'SPEEDING' | 'HARSH_BRAKE' | 'IDLING' | 'FATIGUE' | 'POSITIVE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  occurredAt: Date;
}
