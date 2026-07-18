import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { AdminContext, AdminedRequest } from './admin-context';
import { permissionsForRole } from './roles';

interface AdminClaims {
  sub: string;
  typ?: string;
}

/**
 * Verifies the admin Bearer JWT AND re-validates the account against the database on every
 * request, so authorization is authoritative — not a snapshot from login:
 *  - only tokens with typ:'admin' are accepted (machine/tenant tokens are rejected);
 *  - the admin must still EXIST and be ACTIVE (a disabled admin is locked out immediately);
 *  - permissions + ABAC attributes are read from the CURRENT DB record (role changes take
 *    effect immediately), never trusted from the token payload.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<AdminedRequest & { headers: Record<string, string> }>();
    const header = req.headers['authorization'];
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Missing admin token');

    let claims: AdminClaims;
    try {
      claims = await this.jwt.verifyAsync<AdminClaims>(header.slice(7).trim());
    } catch {
      throw new UnauthorizedException('Invalid or expired admin token');
    }
    if (claims.typ !== 'admin' || !claims.sub) {
      throw new UnauthorizedException('Not an admin token');
    }

    // Authoritative check against the live record.
    const user = await this.prisma.adminUser.findUnique({ where: { id: claims.sub } });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Admin account is not active');
    }

    const attributes = ((user.attributes as Record<string, unknown>) ?? {});
    const admin: AdminContext = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: permissionsForRole(user.role),
      attributes: await this.expandTenantScope(attributes),
    };
    req.admin = admin;
    return true;
  }

  private async expandTenantScope(
    attributes: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const roots = Array.isArray(attributes.tenantRoots)
      ? (attributes.tenantRoots as unknown[]).filter((value): value is string => typeof value === 'string' && value.length > 0)
      : [];
    if (roots.length === 0) return attributes;

    const explicit = Array.isArray(attributes.tenants)
      ? (attributes.tenants as unknown[]).filter((value): value is string => typeof value === 'string' && value.length > 0)
      : [];
    const seen = new Set<string>([...explicit, ...roots]);
    let frontier = [...roots];

    while (frontier.length > 0) {
      const children = await this.prisma.tenant.findMany({
        where: { parentTenantId: { in: frontier } },
        select: { id: true },
      });
      frontier = [];
      for (const child of children) {
        if (seen.has(child.id)) continue;
        seen.add(child.id);
        frontier.push(child.id);
      }
    }

    return { ...attributes, tenants: [...seen] };
  }
}
