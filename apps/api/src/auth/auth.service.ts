import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';

export interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
}

/**
 * OAuth 2.0 client-credentials grant (§34). Exchanges a tenant API client's
 * clientId/clientSecret for a short-lived JWT carrying tenant id and granted scopes.
 * Secrets are compared against a stored hash — never stored or logged in plaintext (§41).
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly ttlSeconds: number,
  ) {}

  async issueToken(clientId: string, clientSecret: string): Promise<TokenResponse> {
    const client = await this.prisma.apiClient.findUnique({ where: { clientId } });
    if (!client || client.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid client credentials');
    }
    const presentedHash = CryptoService.sha256(clientSecret);
    if (presentedHash !== client.clientSecretHash) {
      throw new UnauthorizedException('Invalid client credentials');
    }
    const token = await this.jwt.signAsync(
      { sub: client.clientId, tid: client.tenantId, scopes: client.scopes },
      { expiresIn: this.ttlSeconds },
    );
    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: this.ttlSeconds,
      scope: client.scopes.join(' '),
    };
  }
}
