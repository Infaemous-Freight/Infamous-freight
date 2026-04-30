// Shared domain types for the carrier-facing app. Server responses, Zustand
// store slices, and component props should all import from here so the shapes
// stay aligned without ad-hoc duplication.

export type UserRole = 'driver' | 'dispatcher' | 'admin' | 'owner' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole | string;
  carrierId: string;
  avatar?: string;
}

export type LoadStatus =
  | 'available'
  | 'booked'
  | 'in_transit'
  | 'delivered'
  | 'exception'
  | 'cancelled';

export interface Load {
  id: string;
  origin: string;
  destination: string;
  pickupAt: string;
  deliveryAt: string;
  rate: number;
  miles: number;
  equipment: string;
  status: LoadStatus | string;
  driverId?: string;
  carrierId?: string;
  notes?: string;
}

export type DriverStatus = 'on_duty' | 'off_duty' | 'sleeper' | 'driving';

export interface Driver {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  carrierId: string;
  status: DriverStatus | string;
  hosRemainingHours?: number;
  currentLocation?: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';

export interface Invoice {
  id: string;
  loadId?: string;
  customerName: string;
  amount: number;
  currency: string;
  issuedAt: string;
  dueAt?: string;
  status: InvoiceStatus | string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
