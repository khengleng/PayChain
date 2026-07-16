import { randomBytes } from 'node:crypto';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { hashPassword } from '@paychain/security';
import type { AdminRole, AdminUserStatus } from '@paychain/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AdminContext } from '../admin-auth/admin-context';

const SAFE_SELECT = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  status: true,
  attributes: true,
  mfaEnabled: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

export interface AdminUserView {
  id: string;
  email: string;
  fullName: string | null;
  role: AdminRole;
  status: AdminUserStatus;
  attributes: unknown;
  mfaEnabled: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

function tempPassword(): string {
  return `${randomBytes(12).toString('base64').replace(/[/+=]/g, '').slice(0, 14)}Aa1!`;
}

/**
 * Admin user management (§8). Requires the admin:manage permission (enforced by the guard on
 * the controller). Never returns password hashes or MFA secrets.
 */
@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(): Promise<AdminUserView[]> {
    return this.prisma.adminUser.findMany({ select: SAFE_SELECT, orderBy: { email: 'asc' } });
  }

  async create(
    actor: AdminContext,
    input: { email: string; fullName?: string; role: AdminRole; attributes?: Record<string, unknown> },
    correlationId: string,
  ): Promise<AdminUserView & { tempPassword: string }> {
    const password = tempPassword();
    try {
      const user = await this.prisma.adminUser.create({
        data: {
          email: input.email.toLowerCase(),
          fullName: input.fullName,
          role: input.role,
          attributes: (input.attributes ?? {}) as object,
          passwordHash: hashPassword(password),
          createdBy: actor.email,
        },
        select: SAFE_SELECT,
      });
      await this.audit.record({ actor: actor.email, action: 'admin.user.create', resourceType: 'admin_user', resourceId: user.id, correlationId, metadata: { role: input.role } });
      // Temp password returned once so the creator can share it; the new admin must also
      // enroll MFA on first login.
      return { ...user, tempPassword: password };
    } catch (err) {
      if (this.isUnique(err)) throw new ConflictException('An admin with that email already exists');
      throw err;
    }
  }

  async update(
    actor: AdminContext,
    id: string,
    input: { role?: AdminRole; status?: AdminUserStatus; attributes?: Record<string, unknown> },
    correlationId: string,
  ): Promise<AdminUserView> {
    await this.mustExist(id);
    // Guard against self-lockout: an admin can't disable or downgrade their own account.
    if (id === actor.userId && (input.status === 'DISABLED' || input.role)) {
      throw new BadRequestException('You cannot change your own role or status');
    }
    const user = await this.prisma.adminUser.update({
      where: { id },
      data: {
        ...(input.role ? { role: input.role } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.attributes ? { attributes: input.attributes as object } : {}),
      },
      select: SAFE_SELECT,
    });
    await this.audit.record({ actor: actor.email, action: 'admin.user.update', resourceType: 'admin_user', resourceId: id, correlationId, metadata: { ...input } });
    return user;
  }

  async resetPassword(actor: AdminContext, id: string, correlationId: string) {
    await this.mustExist(id);
    const password = tempPassword();
    await this.prisma.adminUser.update({ where: { id }, data: { passwordHash: hashPassword(password) } });
    await this.audit.record({ actor: actor.email, action: 'admin.user.reset_password', resourceType: 'admin_user', resourceId: id, correlationId });
    return { tempPassword: password };
  }

  async resetMfa(actor: AdminContext, id: string, correlationId: string) {
    await this.mustExist(id);
    await this.prisma.adminUser.update({ where: { id }, data: { mfaEnabled: false, mfaSecretEnc: null } });
    await this.audit.record({ actor: actor.email, action: 'admin.user.reset_mfa', resourceType: 'admin_user', resourceId: id, correlationId });
    return { ok: true };
  }

  private async mustExist(id: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundException('Admin user not found');
  }

  private isUnique(err: unknown): boolean {
    return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'P2002';
  }
}
