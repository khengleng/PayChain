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

    const admin: AdminContext = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: permissionsForRole(user.role),
      attributes: (user.attributes as Record<string, unknown>) ?? {},
    };
    req.admin = admin;
    return true;
  }
}
