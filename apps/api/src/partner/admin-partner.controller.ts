import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CorrelationId } from '../auth/auth-context';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { AdminPermissionGuard, RequireAdminPermission } from '../admin-auth/admin-permission.guard';
import { CurrentAdmin, type AdminContext } from '../admin-auth/admin-context';
import { AdminPartnerService } from './admin-partner.service';
import { RejectPartnerDto } from './dto';

/** Admin review queue for self-service partner applications. */
@Controller('admin/partner-applications')
@UseGuards(AdminAuthGuard, AdminPermissionGuard)
export class AdminPartnerController {
  constructor(private readonly partners: AdminPartnerService) {}

  @Get()
  @RequireAdminPermission('partner:read')
  list() {
    return this.partners.list();
  }

  @Post(':id/approve')
  @RequireAdminPermission('partner:review')
  approve(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() correlationId: string,
    @Param('id') id: string,
  ) {
    return this.partners.approve(admin, id, correlationId);
  }

  @Post(':id/reject')
  @RequireAdminPermission('partner:review')
  reject(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() correlationId: string,
    @Param('id') id: string,
    @Body() dto: RejectPartnerDto,
  ) {
    return this.partners.reject(admin, id, dto.reason, correlationId);
  }
}
