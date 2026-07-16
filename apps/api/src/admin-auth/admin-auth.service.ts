import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verifyPassword } from '@paychain/security';
import type { AdminRole } from '@paychain/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { permissionsForRole, type Permission } from './roles';

export interface AdminLoginResult {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  admin: { email: string; role: string; permissions: Permission[] };
}

/**
 * Admin (human) authentication (§8). Email/password → short-lived admin JWT carrying the
 * user's role, resolved RBAC permissions, and ABAC attributes. Distinct from the machine
 * client-credentials flow: admin tokens carry `typ: 'admin'`.
 */
@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    private readonly ttlSeconds: number,
  ) {}

  async login(email: string, password: string, correlationId: string): Promise<AdminLoginResult> {
    const user = await this.prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
    // Constant-ish failure path: verify against a dummy hash when the user is missing to
    // avoid trivially leaking which emails exist.
    const ok =
      user && user.status === 'ACTIVE' ? verifyPassword(password, user.passwordHash) : false;
    if (!user || !ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const permissions = permissionsForRole(user.role);
    const token = await this.jwt.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        perms: permissions,
        attrs: user.attributes ?? {},
        typ: 'admin',
      },
      { expiresIn: this.ttlSeconds },
    );

    await this.prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.audit.record({
      actor: user.email,
      action: 'admin.login',
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

  /** Convenience for provisioning: resolve the permission set for a role. */
  permissionsFor(role: AdminRole): Permission[] {
    return permissionsForRole(role);
  }
}
