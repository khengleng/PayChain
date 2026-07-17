import { Body, Controller, Get, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { CorrelationId } from '../auth/auth-context';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { AdminPermissionGuard, RequireAdminPermission } from '../admin-auth/admin-permission.guard';
import { CurrentAdmin, type AdminContext } from '../admin-auth/admin-context';
import { assertPermittedByAttributes } from '../admin-auth/abac';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

export class SetWalletPolicyDto {
  /** 'ALL' applies to every stablecoin; an asset id narrows the grant to one. */
  @IsOptional() @IsString() assetId?: string;
  @IsOptional() @IsString() maxBalance?: string;
  @IsOptional() @IsString() maxDailyReceive?: string;
  @IsOptional() @IsString() maxDailySend?: string;
  @IsOptional() @IsString() maxMonthlyVolume?: string;
  @IsOptional() @IsInt() @Min(0) maxTxPerDay?: number;
  @IsOptional() @IsIn(['NONE', 'BASIC', 'STANDARD', 'ENHANCED']) kycLevel?: string;
  @IsOptional() @IsIn(['LOW', 'MEDIUM', 'HIGH']) riskRating?: string;
  @IsOptional() @IsIn(['CLEAR', 'REVIEW', 'MATCH']) sanctionsStatus?: string;
  @IsOptional() @IsBoolean() eddRequired?: boolean;
  @IsOptional() @IsBoolean() transferRestricted?: boolean;
  @IsOptional() @IsBoolean() frozen?: boolean;
  @IsOptional() @IsBoolean() redemptionEligible?: boolean;
}

/**
 * Stablecoin wallet policy administration (§27).
 *
 * WalletPolicyService is default-deny: without a policy a wallet cannot touch stablecoin. That is
 * only workable if an operator can grant one — otherwise §27 would be "enforced" by making the
 * feature permanently unusable, which is not enforcement, it is breakage.
 *
 * Granting stablecoin capability to a customer wallet is a compliance decision, so it requires
 * `wallet:policy` (COMPLIANCE_ADMIN) rather than the ordinary ops wallet permission — freezing a
 * wallet and deciding it may hold regulated value are different judgements by different people.
 */
@Controller('admin')
@UseGuards(AdminAuthGuard, AdminPermissionGuard)
export class AdminWalletPolicyController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get('wallets/:walletId/stablecoin-policy')
  @RequireAdminPermission('wallet:read')
  async list(@CurrentAdmin() admin: AdminContext, @Param('walletId') walletId: string) {
    const wallet = await this.requireWallet(admin, walletId);
    return { items: await this.prisma.walletStablecoinPolicy.findMany({ where: { walletId: wallet.id } }) };
  }

  @Post('wallets/:walletId/stablecoin-policy')
  @RequireAdminPermission('wallet:policy')
  async set(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Param('walletId') walletId: string,
    @Body() dto: SetWalletPolicyDto,
  ) {
    const wallet = await this.requireWallet(admin, walletId);
    const assetId = dto.assetId ?? 'ALL';

    const before = await this.prisma.walletStablecoinPolicy.findUnique({
      where: { walletId_assetId: { walletId, assetId } },
    });

    const policy = await this.prisma.walletStablecoinPolicy.upsert({
      where: { walletId_assetId: { walletId, assetId } },
      update: { ...dto, assetId },
      create: { tenantId: wallet.tenantId, walletId, ...dto, assetId },
    });

    await this.audit.record({
      tenantId: wallet.tenantId,
      actor: admin.email,
      action: before ? 'wallet.stablecoin_policy.updated' : 'wallet.stablecoin_policy.granted',
      resourceType: 'wallet_stablecoin_policy',
      resourceId: policy.id,
      correlationId: corr,
      // Granting stablecoin capability is the decision a reviewer will want to trace, so the
      // prior state is recorded rather than only the fact that something changed.
      metadata: { walletId, assetId, from: before ?? null, to: { ...dto }, role: admin.role },
    });

    return policy;
  }

  /** Cross-tenant is NotFound, never 403 — a 403 would confirm the wallet exists (§7). */
  private async requireWallet(admin: AdminContext, walletId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    assertPermittedByAttributes(admin, { tenantId: wallet.tenantId });
    return wallet;
  }
}
