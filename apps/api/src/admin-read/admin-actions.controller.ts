import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CorrelationId } from '../auth/auth-context';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { AdminPermissionGuard, RequireAdminPermission } from '../admin-auth/admin-permission.guard';
import { CurrentAdmin, type AdminContext } from '../admin-auth/admin-context';
import { AdminActionsService } from './admin-actions.service';
import { SetFlagDto } from './dto';

/**
 * Privileged write actions from the admin console (§37). Each is RBAC-permission-gated,
 * ABAC-scoped, and audited. Reads live on AdminReadController; writes are separated here so
 * the surface is obvious in review.
 */
@Controller('admin')
@UseGuards(AdminAuthGuard, AdminPermissionGuard)
export class AdminActionsController {
  constructor(private readonly svc: AdminActionsService) {}

  @Post('wallets/:walletId/freeze')
  @RequireAdminPermission('wallet:freeze')
  freezeWallet(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Param('walletId') walletId: string,
  ) {
    return this.svc.setWalletFrozen(admin, walletId, true, corr);
  }

  @Post('wallets/:walletId/unfreeze')
  @RequireAdminPermission('wallet:freeze')
  unfreezeWallet(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Param('walletId') walletId: string,
  ) {
    return this.svc.setWalletFrozen(admin, walletId, false, corr);
  }

  @Post('flags')
  @RequireAdminPermission('flags:write')
  setFlag(@CurrentAdmin() admin: AdminContext, @CorrelationId() corr: string, @Body() dto: SetFlagDto) {
    return this.svc.setFlag(admin, dto, corr);
  }

  @Post('treasury/movements/:movementId/approve')
  @RequireAdminPermission('treasury:approve')
  approveTreasury(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Param('movementId') movementId: string,
  ) {
    return this.svc.approveTreasury(admin, movementId, corr);
  }

  @Post('treasury/movements/:movementId/reject')
  @RequireAdminPermission('treasury:approve')
  rejectTreasury(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Param('movementId') movementId: string,
  ) {
    return this.svc.rejectTreasury(admin, movementId, corr);
  }
}
