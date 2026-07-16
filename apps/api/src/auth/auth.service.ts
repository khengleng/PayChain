import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hashClientSecret, verifyClientSecret } from '@paychain/security';
import { PrismaService } from '../prisma/prisma.service';

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
  private readonly log = new Logger(AuthService.name);

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

    const { ok, needsRehash } = verifyClientSecret(clientSecret, client.clientSecretHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    // Transparently upgrade legacy unsalted SHA-256 secrets to scrypt on first successful use,
    // so credentials issued before the change migrate without a flag day or a reset. Never let
    // this fail the request: the caller authenticated correctly, and a rehash is best-effort.
    if (needsRehash) {
      try {
        await this.prisma.apiClient.update({
          where: { id: client.id },
          data: { clientSecretHash: hashClientSecret(clientSecret) },
        });
        this.log.log(`Upgraded client secret hash to scrypt for client ${client.clientId}`);
      } catch (err) {
        this.log.warn(
          `Failed to upgrade client secret hash for ${client.clientId}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
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
