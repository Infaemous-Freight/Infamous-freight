/**
 * Shipment database model.
 *
 * Represents the shape of a row returned by Prisma from the `shipment` table.
 * Business-facing types are re-exported from `@infamous/shared`; this model
 * defines the raw persistence layer representation.
 */
export interface ShipmentModel {
  id: string;
  tenantId: string;
  ref: string;
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  weightLb: number;
  rateCents: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
