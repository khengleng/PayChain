import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CorrelationId, type AuthContext } from '../auth/auth-context';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { AdminPermissionGuard, RequireAdminPermission } from '../admin-auth/admin-permission.guard';
import { CurrentAdmin, type AdminContext } from '../admin-auth/admin-context';
import { assertPermittedByAttributes } from '../admin-auth/abac';
import { AssetsService } from '../assets/assets.service';
import { CreateAssetDto } from '../assets/dto';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Asset provisioning on a tenant's behalf (§13).
 *
 * Defining a loyalty programme is properly the tenant's own job through the API, but an operator
 * needs it to onboard a partner or support one — and admin tokens are deliberately rejected on
 * tenant endpoints (JwtAuthGuard refuses typ=admin), so without this an operator simply cannot
 * create an asset at all.
 *
 * The admin's identity is carried into the tenant-scoped service as the actor, so the audit trail
 * records that a named human did this on the tenant's behalf rather than attributing it to an API
 * client that was never involved.
 */
@Controller('admin')
@UseGuards(AdminAuthGuard, AdminPermissionGuard)
export class AdminAssetsController {
  constructor(
    private readonly assets: AssetsService,
    private readonly prisma: PrismaService,
  ) {}

  private actingAs(admin: AdminContext, tenantId: string): AuthContext {
    assertPermittedByAttributes(admin, { tenantId });
    // `admin:` prefix keeps the actor unambiguous in the trail: this was a human operator, not
    // one of the tenant's API credentials.
    return { tenantId, clientId: `admin:${admin.email}`, scopes: [] };
  }

  @Post('tenants/:tenantId/assets')
  @RequireAdminPermission('asset:write')
  async create(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateAssetDto,
  ) {
    const auth = this.actingAs(admin, tenantId);
    return this.assets.create(auth, dto, corr);
  }

  @Post('assets/:assetId/activate')
  @RequireAdminPermission('asset:write')
  async activate(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Param('assetId') assetId: string,
  ) {
    // Resolve the owning tenant first: the admin surface is cross-tenant, so the tenant comes
    // from the asset itself and is then ABAC-checked, never taken from the caller.
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: { tenantId: true },
    });
    if (!asset) {
      // Reuse the service's own not-found semantics rather than inventing a second shape.
      return this.assets.activate(this.actingAs(admin, 'unknown'), assetId, corr);
    }
    return this.assets.activate(this.actingAs(admin, asset.tenantId), assetId, corr);
  }
}
