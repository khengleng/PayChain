import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { STABLECOIN_FLAGS, GLOBAL_TENANT } from '../feature-flags/feature-flags.constants';
import { TreasuryService } from '../stablecoin/treasury.service';
import { StablecoinService } from '../stablecoin/stablecoin.service';
import { ReserveTieOutService } from '../stablecoin/reserve-tie-out.service';
import { assertPermittedByAttributes, tenantScopeOf, tenantScopeWhere } from '../admin-auth/abac';
import type { AdminContext } from '../admin-auth/admin-context';
import type { ApproveGateDto, SuspendDto } from '../stablecoin/dto';
import type { AuthContext } from '../auth/auth-context';

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
    private readonly stablecoin: StablecoinService,
    private readonly tieOut: ReserveTieOutService,
  ) {}

  /**
   * Runs the 3-way reserve tie-out for every ACTIVE coin in the admin's scope and records the
   * outcome (§31): discrepancies open/refresh a ReconciliationException, reconciled coins auto-close
   * theirs. The resulting exceptions surface in the admin Reconciliation view. Read-only compute
   * lives on GET /admin/reserve/tie-out; this is the write/alert trigger.
   */
  async checkReserveTieOuts(admin: AdminContext, correlationId: string) {
    const scope = tenantScopeOf(admin);
    const configs = await this.prisma.stablecoinConfig.findMany({
      where: { ...tenantScopeWhere(scope), lifecycleState: 'ACTIVE' },
      select: { tenantId: true, assetId: true, asset: { select: { assetCode: true } } },
      take: 200,
    });
    const items: Array<{ assetCode: string; assetId: string; status: string; exceptionId: string | null }> = [];
    for (const c of configs) {
      try {
        const r = await this.tieOut.checkAndRecord(c.tenantId, c.assetId, `admin:${admin.email}`);
        items.push({ assetCode: c.asset.assetCode, assetId: c.assetId, status: r.status, exceptionId: r.exceptionId });
      } catch {
        // Skip a coin whose tie-out cannot be computed; never fail the whole sweep.
      }
    }
    void correlationId;
    return { checked: items.length, openExceptions: items.filter((i) => i.exceptionId).length, items };
  }

  /** Freeze a wallet (routine ops control — distinct from the emergency break-glass path). */
  async setWalletFrozen(admin: AdminContext, walletId: string, frozen: boolean, correlationId: string) {
    const prisma = this.prisma as any;
    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    assertPermittedByAttributes(admin, { tenantId: wallet.tenantId });

    // Freezing is always allowed. Unfreezing returns a wallet to ACTIVE, but only from a
    // FROZEN state — we never silently "un-close" or re-activate a suspended/closing wallet.
    if (!frozen && wallet.status !== 'FROZEN') {
      throw new BadRequestException(`Only a FROZEN wallet can be unfrozen (status=${wallet.status})`);
    }
    const nextStatus = frozen ? 'FROZEN' : 'ACTIVE';
    if (wallet.status === nextStatus) return { id: wallet.id, status: wallet.status };

    const updated = await prisma.wallet.update({
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

  async submitStablecoinForReview(admin: AdminContext, stablecoinId: string, correlationId: string) {
    const auth = await this.stablecoinAuth(admin, stablecoinId);
    return this.stablecoin.submitForReview(auth, stablecoinId, correlationId);
  }

  async approveStablecoinGate(
    admin: AdminContext,
    stablecoinId: string,
    dto: ApproveGateDto,
    correlationId: string,
  ) {
    const auth = await this.stablecoinAuth(admin, stablecoinId);
    return this.stablecoin.approveGate(auth, stablecoinId, dto, correlationId);
  }

  async activateStablecoin(admin: AdminContext, stablecoinId: string, correlationId: string) {
    const auth = await this.stablecoinAuth(admin, stablecoinId);
    return this.stablecoin.advance(auth, stablecoinId, 'ACTIVE', correlationId);
  }

  async suspendStablecoin(
    admin: AdminContext,
    stablecoinId: string,
    dto: SuspendDto,
    correlationId: string,
  ) {
    const auth = await this.stablecoinAuth(admin, stablecoinId);
    return this.stablecoin.suspend(auth, stablecoinId, dto, correlationId);
  }

  private async stablecoinAuth(admin: AdminContext, stablecoinId: string): Promise<AuthContext> {
    const prisma = this.prisma as any;
    const config = await prisma.stablecoinConfig.findUnique({
      where: { id: stablecoinId },
      select: { tenantId: true },
    });
    if (!config) throw new NotFoundException('Stablecoin not found');
    assertPermittedByAttributes(admin, { tenantId: config.tenantId });
    return { tenantId: config.tenantId, clientId: admin.email, scopes: [] };
  }
}
