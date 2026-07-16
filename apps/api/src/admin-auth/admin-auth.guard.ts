import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AdminContext, AdminedRequest } from './admin-context';
import type { Permission } from './roles';

interface AdminClaims {
  sub: string;
  email: string;
  role: string;
  perms: Permission[];
  attrs: Record<string, unknown>;
  typ?: string;
}

/**
 * Verifies the admin Bearer JWT and attaches AdminContext. Rejects machine/tenant tokens
 * (only tokens with typ:'admin' are accepted here), keeping human and machine auth separate.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

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
    if (claims.typ !== 'admin') throw new UnauthorizedException('Not an admin token');

    const admin: AdminContext = {
      userId: claims.sub,
      email: claims.email,
      role: claims.role,
      permissions: claims.perms ?? [],
      attributes: claims.attrs ?? {},
    };
    req.admin = admin;
    return true;
  }
}
