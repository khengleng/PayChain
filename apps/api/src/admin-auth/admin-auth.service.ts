import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { generateTotpSecret, totpUri, verifyPassword, verifyTotp } from '@paychain/security';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { permissionsForRole, type Permission } from './roles';

const CHALLENGE_TTL_SECONDS = 300; // 5 min to complete the MFA step

export interface LoginChallenge {
  mfaRequired: true;
  /** Whether the admin has already enrolled an authenticator (else they must set one up). */
  enrolled: boolean;
  challengeToken: string;
}

export interface MfaSetupResult {
  secret: string;
  otpauthUri: string;
}

export interface AdminLoginResult {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  admin: { email: string; role: string; permissions: Permission[] };
}

/**
 * Admin authentication with ENFORCED MFA (§41). Password alone never yields a session — it
 * only returns a short-lived MFA challenge. A valid TOTP code (after enrolling an
 * authenticator) is required to mint the admin access token.
 */
@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly crypto: CryptoService,
    private readonly audit: AuditService,
    private readonly ttlSeconds: number,
  ) {}

  /** Step 1: verify password → issue an MFA challenge. Never returns a full token. */
  async login(email: string, password: string): Promise<LoginChallenge> {
    const user = await this.prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
    const ok = user && user.status === 'ACTIVE' ? verifyPassword(password, user.passwordHash) : false;
    if (!user || !ok) throw new UnauthorizedException('Invalid credentials');

    const challengeToken = await this.jwt.signAsync(
      { sub: user.id, typ: 'mfa_challenge' },
      { expiresIn: CHALLENGE_TTL_SECONDS },
    );
    return { mfaRequired: true, enrolled: user.mfaEnabled, challengeToken };
  }

  /** Step 2a (first time only): provision a TOTP secret for enrollment. */
  async setupMfa(challengeToken: string): Promise<MfaSetupResult> {
    const user = await this.userFromChallenge(challengeToken);
    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enrolled for this account');
    }
    const secret = generateTotpSecret();
    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: { mfaSecretEnc: this.crypto.encrypt(secret) },
    });
    return { secret, otpauthUri: totpUri(user.email, secret) };
  }

  /** Step 2b: verify the TOTP code → complete enrollment (if needed) and mint the session. */
  async verifyMfa(challengeToken: string, code: string, correlationId: string): Promise<AdminLoginResult> {
    const user = await this.userFromChallenge(challengeToken);
    if (!user.mfaSecretEnc) {
      throw new BadRequestException('No authenticator enrolled — run MFA setup first');
    }
    const secret = this.crypto.decrypt(user.mfaSecretEnc);
    if (!verifyTotp(secret, code)) {
      throw new UnauthorizedException('Invalid authentication code');
    }

    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: { mfaEnabled: true, lastLoginAt: new Date() },
    });

    const permissions = permissionsForRole(user.role);
    const token = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role, typ: 'admin' },
      { expiresIn: this.ttlSeconds },
    );
    await this.audit.record({
      actor: user.email,
      action: 'admin.login.mfa',
      resourceType: 'admin_user',
      resourceId: user.id,
      correlationId,
      metadata: { role: user.role },
    });
    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: this.ttlSeconds,
      admin: { email: user.email, role: user.role, permissions },
    };
  }

  private async userFromChallenge(challengeToken: string) {
    let sub: string;
    try {
      const claims = await this.jwt.verifyAsync<{ sub: string; typ?: string }>(challengeToken);
      if (claims.typ !== 'mfa_challenge') throw new Error('wrong token type');
      sub = claims.sub;
    } catch {
      throw new UnauthorizedException('Invalid or expired MFA challenge');
    }
    const user = await this.prisma.adminUser.findUnique({ where: { id: sub } });
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException('Admin account is not active');
    return user;
  }
}
