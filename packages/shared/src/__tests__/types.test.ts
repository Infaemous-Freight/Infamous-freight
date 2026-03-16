import { describe, it, expect } from 'vitest';
import type { Shipment, ShipmentStatus } from '../types/dispatch.js';
import type { DriverStatus } from '../types/driver.js';

describe('Shared domain types', () => {
  it('ShipmentStatus values are valid', () => {
    const validStatuses: ShipmentStatus[] = [
      'DRAFT', 'POSTED', 'ASSIGNED', 'PICKED_UP',
      'IN_TRANSIT', 'DELIVERED', 'CANCELLED',
    ];
    expect(validStatuses).toHaveLength(7);
  });

  it('Shipment shape is structurally correct', () => {
    const s: Shipment = {
      id: '1',
      status: 'POSTED',
      originAddress: '123 Main St',
      destinationAddress: '456 Oak Ave',
      pickupAt: new Date(),
      deliveredAt: null,
      driverId: null,
      carrierId: 'c1',
      rateCents: 50000,
      weightLbs: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(s.status).toBe('POSTED');
  });

  it('DriverStatus values compile', () => {
    const s: DriverStatus = 'AVAILABLE';
    expect(s).toBe('AVAILABLE');
  });
});
