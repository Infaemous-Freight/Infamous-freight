/**
 * Load database model.
 *
 * Represents the shape of a row returned by Prisma from the `load` table.
 */
export interface LoadModel {
  id: string;
  tenantId: string;
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  distanceMi: number;
  weightLb: number;
  rateCents: number;
  status: string;
  claimedByUserId: string | null;
  claimedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
