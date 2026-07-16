import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthContext, AuthedRequest } from './auth-context';

interface AccessTokenClaims {
  sub: string; // clientId
  tid: string; // tenantId
  scopes: string[];
  typ?: string;
}

/**
 * Validates the Bearer access token and attaches a verified AuthContext to the request.
 * Tenant identity comes exclusively from the signed token (§7, §34).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest & { headers: Record<string, string> }>();
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = header.slice('Bearer '.length).trim();
    let claims: AccessTokenClaims;
    try {
      claims = await this.jwt.verifyAsync<AccessTokenClaims>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    // Reject admin (human) tokens here — they must not be usable on tenant/machine endpoints.
    if (claims.typ === 'admin' || !claims.tid) {
      throw new UnauthorizedException('This token is not valid for tenant API access');
    }
    const auth: AuthContext = {
      tenantId: claims.tid,
      clientId: claims.sub,
      scopes: claims.scopes ?? [],
    };
    req.auth = auth;
    return true;
  }
}
