import type { Request } from 'express';

export type UserRole = 'owner' | 'dispatcher' | 'safety' | 'accountant' | 'driver';

export interface RequestContext {
  userId: string;
  tenantId: string;
  role: UserRole;
}

export interface AppRequest extends Request {
  context?: RequestContext;
}
