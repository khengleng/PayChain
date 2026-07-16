import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { AdminPermissionGuard, RequireAdminPermission } from '../admin-auth/admin-permission.guard';
import { CurrentAdmin, type AdminContext } from '../admin-auth/admin-context';
import { tenantScopeOf } from '../admin-auth/abac';
import { AdminReadService } from './admin-read.service';

/**
 * Read-only admin console API (§37). Each endpoint is gated by the matching RBAC read
 * permission (§7, §8) and is ABAC-filtered to the admin's tenant scope. These back the
 * admin-portal management screens; write actions live in their own gated controllers.
 *
 * Scoping applies to reads as well as writes: an admin restricted to tenant A must not be able
 * to read tenant B's wallets, transactions, reserves or treasury. Enforcing it only on writes
 * would stop them changing another tenant's data while leaving them able to see all of it.
 */
@Controller('admin')
@UseGuards(AdminAuthGuard, AdminPermissionGuard)
export class AdminReadController {
  constructor(private readonly svc: AdminReadService) {}

  // GET admin/tenants now lives on AdminTenantsController, alongside tenant creation and
  // suspension, and keeps this route and response shape.

  @Get('wallets')
  @RequireAdminPermission('wallet:read')
  wallets(@CurrentAdmin() admin: AdminContext, @Query('query') query?: string) {
    return this.svc.wallets(tenantScopeOf(admin), query);
  }

  @Get('assets')
  @RequireAdminPermission('asset:read')
  assets(@CurrentAdmin() admin: AdminContext) {
    return this.svc.assets(tenantScopeOf(admin));
  }

  @Get('stablecoins')
  @RequireAdminPermission('stablecoin:read')
  stablecoins(@CurrentAdmin() admin: AdminContext) {
    return this.svc.stablecoins(tenantScopeOf(admin));
  }

  @Get('reserve')
  @RequireAdminPermission('reserve:read')
  reserve(@CurrentAdmin() admin: AdminContext) {
    return this.svc.reserve(tenantScopeOf(admin));
  }

  @Get('treasury')
  @RequireAdminPermission('treasury:read')
  treasury(@CurrentAdmin() admin: AdminContext) {
    return this.svc.treasury(tenantScopeOf(admin));
  }

  @Get('compliance/alerts')
  @RequireAdminPermission('compliance:read')
  complianceAlerts(@CurrentAdmin() admin: AdminContext) {
    return this.svc.complianceAlerts(tenantScopeOf(admin));
  }

  @Get('reconciliation')
  @RequireAdminPermission('reconciliation:read')
  reconciliation(@CurrentAdmin() admin: AdminContext) {
    return this.svc.reconciliation(tenantScopeOf(admin));
  }

  @Get('flags')
  @RequireAdminPermission('flags:read')
  flags(@CurrentAdmin() admin: AdminContext) {
    return this.svc.flags(tenantScopeOf(admin));
  }

  // GET admin/audit now lives on AuditExportController (apps/api/src/audit), alongside the chain
  // verification and export endpoints, and supports filters + pagination. It kept this route and
  // response shape, so the admin console is unaffected.
}
