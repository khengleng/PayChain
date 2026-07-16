import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { EmergencyActionType } from '@paychain/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { GLOBAL_TENANT } from '../feature-flags/feature-flags.constants';
import { assertPermittedByAttributes } from '../admin-auth/abac';
import type { AdminContext } from '../admin-auth/admin-context';
import { ReadinessService } from './readiness.service';

export interface EmergencyInput {
  action: EmergencyActionType;
  targetId?: string;
  scope?: string; // GLOBAL or a tenant id for flag actions
  reason: string;
}

/**
 * Emergency controls (§37). Fast, audited kill-switches: suspend mint/redeem/convert/transfer,
 * freeze wallets/assets, disable a tenant, disable mainnet writes. Every action records an
 * EmergencyControlEvent AND an audit entry with a reason — never a silent block.
 */
@Injectable()
export class EmergencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: FeatureFlagsService,
    private readonly audit: AuditService,
    private readonly readiness: ReadinessService,
  ) {}

  async execute(admin: AdminContext, input: EmergencyInput, correlationId: string) {
    if (!input.reason || input.reason.trim().length === 0) {
      throw new BadRequestException('An emergency action requires a reason');
    }
    const scope = input.scope ?? GLOBAL_TENANT;
    const actor = admin.email;

    switch (input.action) {
      case 'SUSPEND_MINTING':
        await this.flags.set('stablecoin.minting.enabled', false, scope, actor);
        break;
      case 'SUSPEND_REDEMPTION':
        await this.flags.set('stablecoin.redemption.enabled', false, scope, actor);
        break;
      case 'SUSPEND_CONVERSION':
        await this.flags.set('stablecoin.conversion.enabled', false, scope, actor);
        break;
      case 'SUSPEND_TRANSFERS':
        await this.flags.set('stablecoin.transfer.enabled', false, scope, actor);
        break;
      case 'DISABLE_MAINNET_WRITES':
        await this.flags.set('stablecoin.mainnet.enabled', false, GLOBAL_TENANT, actor);
        break;
      case 'FREEZE_WALLET':
        await this.freezeWallet(admin, this.requireTarget(input));
        break;
      case 'FREEZE_ASSET':
        await this.freezeAsset(admin, this.requireTarget(input));
        break;
      case 'DISABLE_TENANT':
        await this.disableTenant(admin, this.requireTarget(input));
        break;
      default:
        throw new BadRequestException(`Unsupported emergency action: ${input.action}`);
    }

    const event = await this.prisma.emergencyControlEvent.create({
      data: { action: input.action, scope: input.targetId ?? scope, reason: input.reason, actor },
    });
    await this.audit.record({
      actor,
      action: `emergency.${input.action.toLowerCase()}`,
      resourceType: 'emergency_control',
      resourceId: event.id,
      correlationId,
      metadata: { target: input.targetId, scope, reason: input.reason, role: admin.role },
    });
    return event;
  }

  /**
   * Mainnet write enablement is guarded by the readiness gates (§0.2, §43): it can only be
   * turned on once EVERY mandatory gate passes. Until then this refuses.
   */
  async enableMainnetWrites(actor: string, correlationId: string) {
    await this.readiness.assertProductionReady(); // throws if any mandatory gate is unmet
    await this.flags.set('stablecoin.mainnet.enabled', true, GLOBAL_TENANT, actor);
    await this.audit.record({
      actor,
      action: 'emergency.enable_mainnet_writes',
      resourceType: 'feature_flag',
      resourceId: 'stablecoin.mainnet.enabled',
      correlationId,
    });
    return { enabled: true };
  }

  async listEvents() {
    return this.prisma.emergencyControlEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  private requireTarget(input: EmergencyInput): string {
    if (!input.targetId) throw new BadRequestException(`${input.action} requires a targetId`);
    return input.targetId;
  }

  private async freezeWallet(admin: AdminContext, walletId: string): Promise<void> {
    const wallet = await this.prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    // ABAC: a tenant-scoped admin may only freeze wallets in their tenants.
    assertPermittedByAttributes(admin, { tenantId: wallet.tenantId });
    await this.prisma.wallet.update({ where: { id: walletId }, data: { status: 'FROZEN' } });
  }

  private async freezeAsset(admin: AdminContext, assetId: string): Promise<void> {
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) throw new NotFoundException('Asset not found');
    assertPermittedByAttributes(admin, { tenantId: asset.tenantId });
    await this.prisma.asset.update({ where: { id: assetId }, data: { status: 'SUSPENDED' } });
  }

  private async disableTenant(admin: AdminContext, tenantId: string): Promise<void> {
    assertPermittedByAttributes(admin, { tenantId });
    await this.prisma.tenant.update({ where: { id: tenantId }, data: { status: 'SUSPENDED' } });
  }
}
