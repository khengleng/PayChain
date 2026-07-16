import { UnauthorizedException, createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Permission } from './roles';

/** The authenticated admin, derived from a verified admin JWT and attached by AdminAuthGuard. */
export interface AdminContext {
  userId: string;
  email: string;
  role: string;
  permissions: Permission[];
  /** ABAC attributes (tenant scope, region, clearance, …). */
  attributes: Record<string, unknown>;
}

export interface AdminedRequest {
  admin?: AdminContext;
  correlationId: string;
}

export const CurrentAdmin = createParamDecorator((_data: unknown, ctx: ExecutionContext): AdminContext => {
  const req = ctx.switchToHttp().getRequest<AdminedRequest>();
  if (!req.admin) throw new UnauthorizedException('Admin authentication required');
  return req.admin;
});
