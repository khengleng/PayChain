import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { EmergencyActionType } from '@paychain/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { GLOBAL_TENANT } from '../feature-flags/feature-flags.constants';
import type { AuthContext } from '../auth/auth-context';
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

  async execute(auth: AuthContext, input: EmergencyInput, correlationId: string) {
    if (!input.reason || input.reason.trim().length === 0) {
      throw new BadRequestException('An emergency action requires a reason');
    }
    const scope = input.scope ?? GLOBAL_TENANT;

    switch (input.action) {
      case 'SUSPEND_MINTING':
        await this.flags.set('stablecoin.minting.enabled', false, scope, auth.clientId);
        break;
      case 'SUSPEND_REDEMPTION':
        await this.flags.set('stablecoin.redemption.enabled', false, scope, auth.clientId);
        break;
      case 'SUSPEND_CONVERSION':
        await this.flags.set('stablecoin.conversion.enabled', false, scope, auth.clientId);
        break;
      case 'SUSPEND_TRANSFERS':
        await this.flags.set('stablecoin.transfer.enabled', false, scope, auth.clientId);
        break;
      case 'DISABLE_MAINNET_WRITES':
        await this.flags.set('stablecoin.mainnet.enabled', false, GLOBAL_TENANT, auth.clientId);
        break;
      case 'FREEZE_WALLET':
        await this.freezeWallet(auth.tenantId, this.requireTarget(input));
        break;
      case 'FREEZE_ASSET':
        await this.freezeAsset(auth.tenantId, this.requireTarget(input));
        break;
      case 'DISABLE_TENANT':
        await this.disableTenant(this.requireTarget(input));
        break;
      default:
        throw new BadRequestException(`Unsupported emergency action: ${input.action}`);
    }

    const event = await this.prisma.emergencyControlEvent.create({
      data: {
        tenantId: auth.tenantId,
        action: input.action,
        scope: input.targetId ?? scope,
        reason: input.reason,
        actor: auth.clientId,
      },
    });
    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: `emergency.${input.action.toLowerCase()}`,
      resourceType: 'emergency_control',
      resourceId: event.id,
      correlationId,
      metadata: { target: input.targetId, scope, reason: input.reason },
    });
    return event;
  }

  /**
   * Mainnet write enablement is guarded by the readiness gates (§0.2, §43): it can only be
   * turned on once EVERY mandatory gate passes. Until then this refuses.
   */
  async enableMainnetWrites(auth: AuthContext, correlationId: string) {
    await this.readiness.assertProductionReady(); // throws if any mandatory gate is unmet
    await this.flags.set('stablecoin.mainnet.enabled', true, GLOBAL_TENANT, auth.clientId);
    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'emergency.enable_mainnet_writes',
      resourceType: 'feature_flag',
      resourceId: 'stablecoin.mainnet.enabled',
      correlationId,
    });
    return { enabled: true };
  }

  async listEvents(auth: AuthContext) {
    return this.prisma.emergencyControlEvent.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  private requireTarget(input: EmergencyInput): string {
    if (!input.targetId) throw new BadRequestException(`${input.action} requires a targetId`);
    return input.targetId;
  }

  private async freezeWallet(tenantId: string, walletId: string): Promise<void> {
    const wallet = await this.prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet || wallet.tenantId !== tenantId) throw new NotFoundException('Wallet not found');
    await this.prisma.wallet.update({ where: { id: walletId }, data: { status: 'FROZEN' } });
  }

  private async freezeAsset(tenantId: string, assetId: string): Promise<void> {
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset || asset.tenantId !== tenantId) throw new NotFoundException('Asset not found');
    await this.prisma.asset.update({ where: { id: assetId }, data: { status: 'SUSPENDED' } });
  }

  private async disableTenant(tenantId: string): Promise<void> {
    await this.prisma.tenant.update({ where: { id: tenantId }, data: { status: 'SUSPENDED' } });
  }
}
