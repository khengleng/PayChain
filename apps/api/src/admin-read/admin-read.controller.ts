import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { AdminPermissionGuard, RequireAdminPermission } from '../admin-auth/admin-permission.guard';
import { AdminReadService } from './admin-read.service';

/**
 * Read-only admin console API (§37). Each endpoint is gated by the matching RBAC read
 * permission (§7, §8) and returns a cross-tenant view. These back the admin-portal
 * management screens; write actions live in their own gated controllers.
 */
@Controller('admin')
@UseGuards(AdminAuthGuard, AdminPermissionGuard)
export class AdminReadController {
  constructor(private readonly svc: AdminReadService) {}

  @Get('tenants')
  @RequireAdminPermission('tenant:read')
  tenants() {
    return this.svc.tenants();
  }

  @Get('wallets')
  @RequireAdminPermission('wallet:read')
  wallets(@Query('query') query?: string) {
    return this.svc.wallets(query);
  }

  @Get('assets')
  @RequireAdminPermission('asset:read')
  assets() {
    return this.svc.assets();
  }

  @Get('stablecoins')
  @RequireAdminPermission('stablecoin:read')
  stablecoins() {
    return this.svc.stablecoins();
  }

  @Get('reserve')
  @RequireAdminPermission('reserve:read')
  reserve() {
    return this.svc.reserve();
  }

  @Get('treasury')
  @RequireAdminPermission('treasury:read')
  treasury() {
    return this.svc.treasury();
  }

  @Get('compliance/alerts')
  @RequireAdminPermission('compliance:read')
  complianceAlerts() {
    return this.svc.complianceAlerts();
  }

  @Get('reconciliation')
  @RequireAdminPermission('reconciliation:read')
  reconciliation() {
    return this.svc.reconciliation();
  }

  @Get('flags')
  @RequireAdminPermission('flags:read')
  flags() {
    return this.svc.flags();
  }

  @Get('audit')
  @RequireAdminPermission('audit:read')
  audit() {
    return this.svc.audit();
  }
}
