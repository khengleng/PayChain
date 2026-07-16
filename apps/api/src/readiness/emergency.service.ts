import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { EmergencyActionType } from '@paychain/database';
import type { PayChainConfig } from '@paychain/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CONFIG } from '../config/config.module';
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
 * freeze wallets/assets, disable a tenant. Every action records an EmergencyControlEvent AND an
 * audit entry with a reason — never a silent block.
 *
 * The suspend/freeze/disable actions are load-bearing: the flags they clear are read on every
 * corresponding write path (see FeatureFlagsService.requireEnabled callers). DISABLE_MAINNET_WRITES
 * is the exception — mainnet is excluded at config, so it clears an intent flag rather than
 * stopping traffic. It is documented as such rather than presented as a live kill-switch.
 */
@Injectable()
export class EmergencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: FeatureFlagsService,
    private readonly audit: AuditService,
    private readonly readiness: ReadinessService,
    @Inject(CONFIG) private readonly cfg: PayChainConfig,
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
        // Belt-and-braces only: mainnet writes are already impossible because STELLAR_NETWORK
        // cannot be 'mainnet' (see enableMainnetWrites). This clears the intent flag so the
        // recorded state stays consistent; it is not what stops a mainnet write today.
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
   * Mainnet write enablement is guarded by TWO independent controls, and both must give way
   * before this can succeed:
   *
   *  1. Readiness gates (§0.2, §43) — every mandatory gate must pass. Process control.
   *  2. STELLAR_NETWORK config (packages/config) — the *enforcing* control. The enum admits
   *     only testnet/futurenet, so the running process has no mainnet write path at all.
   *
   * (2) is what actually stops mainnet writes; the flag set below is a record of intent that
   * no code path currently reads. So we refuse unless the runtime could genuinely honor it —
   * otherwise this would persist `stablecoin.mainnet.enabled = true` and imply a capability
   * that does not exist. Enabling mainnet is therefore a deliberate code+config change, not a
   * toggle, and this endpoint's job is to say so precisely rather than to fake a switch.
   */
  async enableMainnetWrites(actor: string, correlationId: string) {
    await this.readiness.assertProductionReady(); // throws if any mandatory gate is unmet
    if (this.cfg.STELLAR_NETWORK !== ('mainnet' as string)) {
      throw new ConflictException(
        `Cannot enable mainnet writes: STELLAR_NETWORK is '${this.cfg.STELLAR_NETWORK}' and the ` +
          `config schema admits only testnet/futurenet, so no mainnet write path exists in this ` +
          `build. Setting the flag here would claim a capability the runtime does not have. ` +
          `Enabling mainnet requires a deliberate code + config change (§0.2, §0.6).`,
      );
    }
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
