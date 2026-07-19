import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { PartnerRequest } from './partner-context';

interface PartnerClaims {
  sub: string;
  typ?: string;
}

/**
 * Verifies a partner Bearer JWT (typ:'partner') and re-validates the account against the DB on
 * every request (a suspended partner is locked out immediately), mirroring AdminAuthGuard. Only
 * partner tokens are accepted — admin/tenant tokens are rejected.
 */
@Injectable()
export class PartnerAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<PartnerRequest & { headers: Record<string, string> }>();
    const header = req.headers['authorization'];
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Missing partner token');

    let claims: PartnerClaims;
    try {
      claims = await this.jwt.verifyAsync<PartnerClaims>(header.slice(7).trim());
    } catch {
      throw new UnauthorizedException('Invalid or expired partner token');
    }
    if (claims.typ !== 'partner' || !claims.sub) {
      throw new UnauthorizedException('Not a partner token');
    }

    const user = await this.prisma.partnerUser.findUnique({ where: { id: claims.sub } });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Partner account is not active');
    }

    req.partner = {
      userId: user.id,
      email: user.email,
      applicationId: user.applicationId,
      tenantId: user.tenantId,
    };
    return true;
  }
}
