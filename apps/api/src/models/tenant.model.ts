/**
 * Tenant database model.
 *
 * Represents the shape of a row returned by Prisma from the `tenant` table.
 */
export interface TenantModel {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: Date;
  updatedAt: Date;
}
