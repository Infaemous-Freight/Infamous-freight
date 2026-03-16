export interface Shipment {
  id: string;
  status: ShipmentStatus;
  originAddress: string;
  destinationAddress: string;
  pickupAt: Date;
  deliveredAt: Date | null;
  driverId: string | null;
  carrierId: string;
  rateCents: number;
  weightLbs: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ShipmentStatus =
  | 'DRAFT'
  | 'POSTED'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export interface DispatchAssignment {
  shipmentId: string;
  driverId: string;
  assignedAt: Date;
  assignedBy: string;
}
