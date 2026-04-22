import type { NextFunction, Response } from 'express';
import { AppError } from './errors';
import type { AppRequest, UserRole } from './runtime-types';

const validRoles: ReadonlySet<UserRole> = new Set([
  'owner',
  'dispatcher',
  'safety',
  'accountant',
  'driver',
]);

export function requireAuth(req: AppRequest, _res: Response, next: NextFunction) {
  const authHeader = req.header('authorization');
  const userId = req.header('x-user-id');
  const tenantId = req.header('x-tenant-id');
  const role = req.header('x-role') as UserRole | undefined;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Missing or invalid authorization header'));
  }

  if (!userId || !tenantId || !role || !validRoles.has(role)) {
    return next(new AppError(401, 'Missing or invalid request identity headers'));
  }

  req.context = {
    userId,
    tenantId,
    role,
  };

  return next();
}

export function requireRole(allowedRoles: UserRole[]) {
  const allowedSet = new Set<UserRole>(allowedRoles);

  return (req: AppRequest, _res: Response, next: NextFunction) => {
    const role = req.context?.role;

    if (!role || !allowedSet.has(role)) {
      return next(new AppError(403, 'Forbidden'));
    }

    return next();
  };
}
