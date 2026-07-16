import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AdminedRequest } from './admin-context';
import type { Permission } from './roles';

export const ADMIN_PERMISSION_KEY = 'admin_required_permission';

/** Declares the RBAC permission a handler requires (§7, §8). */
export const RequireAdminPermission = (permission: Permission): MethodDecorator & ClassDecorator =>
  SetMetadata(ADMIN_PERMISSION_KEY, permission);

/** Enforces that the authenticated admin holds the required permission (RBAC). */
@Injectable()
export class AdminPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission | undefined>(ADMIN_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const req = context.switchToHttp().getRequest<AdminedRequest>();
    const perms = req.admin?.permissions ?? [];
    if (!perms.includes(required)) {
      throw new ForbiddenException(`Missing required permission: ${required}`);
    }
    return true;
  }
}
