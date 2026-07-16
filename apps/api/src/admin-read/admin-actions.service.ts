import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { STABLECOIN_FLAGS, GLOBAL_TENANT } from '../feature-flags/feature-flags.constants';
import { TreasuryService } from '../stablecoin/treasury.service';
import { assertPermittedByAttributes } from '../admin-auth/abac';
import type { AdminContext } from '../admin-auth/admin-context';

/**
 * Privileged write actions from the admin console (§37). Read visibility lives in
 * AdminReadService; the mutations here are each RBAC-permission-gated (enforced by the guard
 * on the controller), ABAC-scoped to the admin's tenants, and audited with a reason where the
 * action warrants one. Nothing here bypasses a maker-checker or a feature-flag safety gate.
 */
@Injectable()
export class AdminActionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly flags: FeatureFlagsService,
    private readonly treasury: TreasuryService,
  ) {}

  /** Freeze a wallet (routine ops control — distinct from the emergency break-glass path). */
  async setWalletFrozen(admin: AdminContext, walletId: string, frozen: boolean, correlationId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    assertPermittedByAttributes(admin, { tenantId: wallet.tenantId });

    // Freezing is always allowed. Unfreezing returns a wallet to ACTIVE, but only from a
    // FROZEN state — we never silently "un-close" or re-activate a suspended/closing wallet.
    if (!frozen && wallet.status !== 'FROZEN') {
      throw new BadRequestException(`Only a FROZEN wallet can be unfrozen (status=${wallet.status})`);
    }
    const nextStatus = frozen ? 'FROZEN' : 'ACTIVE';
    if (wallet.status === nextStatus) return { id: wallet.id, status: wallet.status };

    const updated = await this.prisma.wallet.update({
      where: { id: walletId },
      data: { status: nextStatus },
      select: { id: true, status: true },
    });
    await this.audit.record({
      tenantId: wallet.tenantId,
      actor: admin.email,
      action: frozen ? 'wallet.freeze' : 'wallet.unfreeze',
      resourceType: 'wallet',
      resourceId: walletId,
      correlationId,
      metadata: { from: wallet.status, to: nextStatus, via: 'admin-portal' },
    });
    return updated;
  }

  /**
   * Set a feature flag (§36). Only declared stablecoin.* flags are settable here. The mainnet
   * write flag is deliberately NOT enable-able through this raw toggle — it must go through the
   * readiness-gated `/admin/mainnet/enable` path so it can never be turned on with unmet gates.
   */
  async setFlag(
    admin: AdminContext,
    input: { key: string; enabled: boolean; scope?: string },
    correlationId: string,
  ) {
    if (!STABLECOIN_FLAGS.includes(input.key as never)) {
      throw new BadRequestException(`Unknown feature flag: ${input.key}`);
    }
    if (input.key === 'stablecoin.mainnet.enabled' && input.enabled) {
      throw new BadRequestException(
        'Mainnet writes cannot be enabled with a raw flag toggle — use the readiness-gated mainnet enable path.',
      );
    }
    const scope = input.scope?.trim() || GLOBAL_TENANT;
    // A tenant-scoped admin may not change a global default or another tenant's override.
    if (scope !== GLOBAL_TENANT) {
      assertPermittedByAttributes(admin, { tenantId: scope });
    } else {
      const tenants = Array.isArray(admin.attributes?.tenants) ? (admin.attributes.tenants as string[]) : [];
      if (tenants.length > 0) {
        throw new ForbiddenException('Tenant-scoped admins cannot change the GLOBAL flag default');
      }
    }

    await this.flags.set(input.key, input.enabled, scope, admin.email);
    await this.audit.record({
      actor: admin.email,
      action: 'feature_flag.set',
      resourceType: 'feature_flag',
      resourceId: input.key,
      correlationId,
      metadata: { scope, enabled: input.enabled, via: 'admin-portal' },
    });
    return { key: input.key, scope, enabled: input.enabled };
  }

  approveTreasury(admin: AdminContext, movementId: string, correlationId: string) {
    return this.treasury.adminApprove(admin, movementId, correlationId);
  }

  rejectTreasury(admin: AdminContext, movementId: string, correlationId: string) {
    return this.treasury.adminReject(admin, movementId, correlationId);
  }
}
