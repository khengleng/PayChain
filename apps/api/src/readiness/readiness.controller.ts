import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CorrelationId } from '../auth/auth-context';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { AdminPermissionGuard, RequireAdminPermission } from '../admin-auth/admin-permission.guard';
import { CurrentAdmin, type AdminContext } from '../admin-auth/admin-context';
import { ReadinessService } from './readiness.service';
import { EmergencyService } from './emergency.service';
import { EmergencyActionDto, SetGateDto } from './dto';

/**
 * Production-readiness + emergency controls admin API (§37, §43). Protected by admin (human)
 * authentication with RBAC permissions; emergency freezes additionally apply ABAC scoping.
 */
@Controller('admin')
@UseGuards(AdminAuthGuard, AdminPermissionGuard)
export class ReadinessController {
  constructor(
    private readonly readiness: ReadinessService,
    private readonly emergency: EmergencyService,
  ) {}

  @Get('readiness')
  @RequireAdminPermission('readiness:read')
  async getReadiness() {
    const [gates, summary] = await Promise.all([this.readiness.list(), this.readiness.summary()]);
    return { summary, gates };
  }

  @Post('readiness/:key')
  @RequireAdminPermission('readiness:write')
  setGate(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Param('key') key: string,
    @Body() dto: SetGateDto,
  ) {
    return this.readiness.setGate(admin.email, key, dto, corr);
  }

  @Post('emergency')
  @RequireAdminPermission('emergency:execute')
  emergencyAction(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Body() dto: EmergencyActionDto,
  ) {
    return this.emergency.execute(admin, dto, corr);
  }

  @Get('emergency/events')
  @RequireAdminPermission('readiness:read')
  listEvents() {
    return this.emergency.listEvents();
  }

  /** Attempt to enable mainnet writes — blocked until every mandatory readiness gate passes. */
  @Post('mainnet/enable')
  @RequireAdminPermission('mainnet:enable')
  enableMainnet(@CurrentAdmin() admin: AdminContext, @CorrelationId() corr: string) {
    return this.emergency.enableMainnetWrites(admin.email, corr);
  }
}
