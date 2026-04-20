import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RBACService, Permission } from './rbac.service';
import { SKIP_RATE_LIMIT_KEY } from '../rate-limit/skip-rate-limit.decorator';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';
export const RequirePermissions = (...permissions: Permission[]) => {
  // Work around SetMetadata + reflector
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(REQUIRED_PERMISSIONS_KEY, permissions, descriptor.value);
    }
    return target;
  };
};

@Injectable()
export class RBACGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbac: RBACService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if rate limit skip is set (skip RBAC too for public endpoints)
    const skipRateLimit = this.reflector.getAllAndOverride<boolean>(SKIP_RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipRateLimit) return true;

    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No permissions required = allow
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    const member = await this.rbac.getMember(userId);
    if (!member || member.status !== 'active') {
      throw new ForbiddenException('Team membership required');
    }

    const hasPermission = this.rbac.hasAnyPermission(member, requiredPermissions);
    if (!hasPermission) {
      throw new ForbiddenException(`Requires one of: ${requiredPermissions.join(', ')}`);
    }

    // Attach member to request for downstream use
    request.teamMember = member;

    return true;
  }
}
