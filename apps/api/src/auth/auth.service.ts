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

export interface AuthAttemptMeta {
  ip?: string | null;
  userAgent?: string | null;
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

  async issueToken(clientId: string, clientSecret: string, meta: AuthAttemptMeta = {}): Promise<TokenResponse> {
    const client = await this.prisma.apiClient.findUnique({ where: { clientId } });
    if (!client || client.status !== 'ACTIVE') {
      await this.recordAttempt({ clientIdValue: clientId, success: false, failureReason: 'INVALID_CREDENTIALS', ...meta });
      throw new UnauthorizedException('Invalid client credentials');
    }

    const { ok, needsRehash } = verifyClientSecret(clientSecret, client.clientSecretHash);
    if (!ok) {
      await this.recordAttempt({
        apiClientId: client.id,
        tenantId: client.tenantId,
        clientIdValue: clientId,
        success: false,
        failureReason: 'INVALID_CREDENTIALS',
        ...meta,
      });
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

    await this.prisma.apiClient.update({
      where: { id: client.id },
      data: { lastTokenIssuedAt: new Date() },
    });

    await this.recordAttempt({
      apiClientId: client.id,
      tenantId: client.tenantId,
      clientIdValue: clientId,
      success: true,
      failureReason: null,
      ...meta,
    });

    const token = await this.jwt.signAsync(
      { sub: client.clientId, tid: client.tenantId, scopes: client.scopes, ver: client.tokenVersion },
      { expiresIn: this.ttlSeconds },
    );
    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: this.ttlSeconds,
      scope: client.scopes.join(' '),
    };
  }

  private async recordAttempt(input: {
    apiClientId?: string;
    tenantId?: string;
    clientIdValue: string;
    success: boolean;
    failureReason: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    await this.prisma.apiClientAuthAttempt.create({
      data: {
        apiClientId: input.apiClientId ?? null,
        tenantId: input.tenantId ?? null,
        clientIdValue: input.clientIdValue,
        success: input.success,
        failureReason: input.failureReason,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  }
}
