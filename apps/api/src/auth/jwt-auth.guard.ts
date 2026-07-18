import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthContext, AuthedRequest } from './auth-context';

interface AccessTokenClaims {
  sub: string; // clientId
  tid: string; // tenantId
  scopes: string[];
  typ?: string;
  ver?: number;
}

/**
 * Validates the Bearer access token and attaches a verified AuthContext to the request.
 * Tenant identity comes exclusively from the signed token (§7, §34).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

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
    const client = await this.prisma.apiClient.findUnique({
      where: { clientId: claims.sub },
      select: {
        id: true,
        tenantId: true,
        status: true,
        scopes: true,
        tokenVersion: true,
        requestsPerMinuteLimit: true,
        writeRequestsPerMinuteLimit: true,
      },
    });
    if (!client || client.status !== 'ACTIVE' || client.tenantId !== claims.tid) {
      throw new UnauthorizedException('This client is no longer authorized');
    }
    if ((claims.ver ?? 1) !== client.tokenVersion) {
      throw new UnauthorizedException('This token has been superseded by a credential change');
    }
    await this.enforceRateLimits(req, client);
    const auth: AuthContext = {
      apiClientId: client.id,
      tenantId: claims.tid,
      clientId: claims.sub,
      scopes: client.scopes,
    };
    req.auth = auth;
    return true;
  }

  private async enforceRateLimits(
    req: AuthedRequest & {
      method?: string;
      originalUrl?: string;
      route?: { path?: string };
      baseUrl?: string;
      path?: string;
    },
    client: {
      id: string;
      requestsPerMinuteLimit: number;
      writeRequestsPerMinuteLimit: number;
    },
  ): Promise<void> {
    const since = new Date(Date.now() - 60_000);
    const allRequests = await this.prisma.apiClientRequestLog.count({
      where: { apiClientId: client.id, createdAt: { gte: since } },
    });
    if (allRequests >= client.requestsPerMinuteLimit) {
      throw new HttpException('Per-client request rate exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }
    const method = (req.method ?? 'GET').toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return;
    const writeRequests = await this.prisma.apiClientRequestLog.count({
      where: {
        apiClientId: client.id,
        createdAt: { gte: since },
        method: { in: ['POST', 'PUT', 'PATCH', 'DELETE'] },
      },
    });
    if (writeRequests >= client.writeRequestsPerMinuteLimit) {
      throw new HttpException('Per-client write rate exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}
