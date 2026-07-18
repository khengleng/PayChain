import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CorrelationId } from '../auth/auth-context';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { AdminPermissionGuard, RequireAdminPermission } from '../admin-auth/admin-permission.guard';
import { CurrentAdmin, type AdminContext } from '../admin-auth/admin-context';
import { AdminTenantsService } from './admin-tenants.service';
import { CreateRetailerTenantDto, CreateTenantDto, SetTenantStatusDto, UpdateTenantPolicyDto } from './dto';

/**
 * Tenant provisioning (§7) — the first half of onboarding a partner; issuing their API
 * credentials (admin/tenants/:id/clients) is the second.
 *
 * `tenant:write` was in the permission catalog from the start and enforced nowhere, because no
 * endpoint created tenants. This is that endpoint.
 */
@Controller('admin/tenants')
@UseGuards(AdminAuthGuard, AdminPermissionGuard)
export class AdminTenantsController {
  constructor(private readonly tenants: AdminTenantsService) {}

  @Get()
  @RequireAdminPermission('tenant:read')
  list(@CurrentAdmin() admin: AdminContext) {
    return this.tenants.list(admin);
  }

  @Post()
  @RequireAdminPermission('tenant:write')
  create(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Body() dto: CreateTenantDto,
  ) {
    return this.tenants.create(admin, dto, corr);
  }

  @Get(':tenantId/retailers')
  @RequireAdminPermission('tenant:read')
  retailers(
    @CurrentAdmin() admin: AdminContext,
    @Param('tenantId') tenantId: string,
  ) {
    return this.tenants.retailers(admin, tenantId);
  }

  @Post(':tenantId/retailers')
  @RequireAdminPermission('tenant:write')
  createRetailer(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateRetailerTenantDto,
  ) {
    return this.tenants.createRetailer(admin, tenantId, dto, corr);
  }

  @Post(':tenantId/policy')
  @RequireAdminPermission('tenant:write')
  setPolicy(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateTenantPolicyDto,
  ) {
    return this.tenants.updatePolicy(admin, tenantId, dto, corr);
  }

  /**
   * Suspending a tenant is a containment control, so it is deliberately reachable here rather
   * than only through the emergency console.
   */
  @Post(':tenantId/status')
  @RequireAdminPermission('tenant:write')
  setStatus(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Param('tenantId') tenantId: string,
    @Body() dto: SetTenantStatusDto,
  ) {
    return this.tenants.setStatus(admin, tenantId, dto.status, corr);
  }
}
