import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CorrelationId, type AuthContext } from '../auth/auth-context';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { AdminPermissionGuard, RequireAdminPermission } from '../admin-auth/admin-permission.guard';
import { CurrentAdmin, type AdminContext } from '../admin-auth/admin-context';
import { assertPermittedByAttributes, tenantScopeWhere, tenantScopeOf } from '../admin-auth/abac';
import { PrismaService } from '../prisma/prisma.service';
import { ReserveService } from '../stablecoin/reserve.service';
import { ReserveAccountDto, ReserveMovementDto, RejectMovementDto } from '../stablecoin/workflow.dto';

/**
 * Reserve operations from the admin console (§23).
 *
 * The reserve is what backs customer tokens, and until now it could only be touched by a tenant's
 * API credential — an operator could see reserve accounts and change nothing. Maker-checker works
 * across the console because both sides are admin emails: `admin:<email>` is carried into the
 * tenant-scoped service as the actor, so a request by one operator cannot be approved by the same
 * one, and the trail names both humans.
 */
@Controller('admin')
@UseGuards(AdminAuthGuard, AdminPermissionGuard)
export class AdminReserveController {
  constructor(
    private readonly reserve: ReserveService,
    private readonly prisma: PrismaService,
  ) {}

  private actingAs(admin: AdminContext, tenantId: string): AuthContext {
    assertPermittedByAttributes(admin, { tenantId });
    return { tenantId, clientId: `admin:${admin.email}`, scopes: [] };
  }

  /** Pending and recent movements across the admin's tenant scope, for an approval queue. */
  @Get('reserve/movements')
  @RequireAdminPermission('reserve:read')
  async movements(@CurrentAdmin() admin: AdminContext) {
    const scope = tenantScopeOf(admin);
    const [rows, tenants] = await Promise.all([
      this.prisma.reserveMovement.findMany({
        where: tenantScopeWhere(scope),
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: { account: { select: { label: true, assetId: true } } },
      }),
      this.prisma.tenant.findMany({ select: { id: true, name: true } }),
    ]);
    const names = new Map(tenants.map((t) => [t.id, t.name]));
    return {
      items: rows.map((m) => ({
        id: m.id,
        tenant: names.get(m.tenantId) ?? m.tenantId,
        tenantId: m.tenantId,
        account: m.account.label,
        assetId: m.account.assetId,
        direction: m.direction,
        amount: m.amount,
        reference: m.reference,
        status: m.status,
        createdBy: m.createdBy,
        approvedBy: m.approvedBy,
        balanceAfter: m.balanceAfter,
        createdAt: m.createdAt,
      })),
    };
  }

  @Post('tenants/:tenantId/reserve-accounts')
  @RequireAdminPermission('reserve:manage')
  registerAccount(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Param('tenantId') tenantId: string,
    @Body() dto: ReserveAccountDto & { assetId: string },
  ) {
    return this.reserve.registerAccount(this.actingAs(admin, tenantId), dto, corr);
  }

  @Post('tenants/:tenantId/reserve/movements')
  @RequireAdminPermission('reserve:manage')
  request(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Param('tenantId') tenantId: string,
    @Body() dto: ReserveMovementDto,
  ) {
    return this.reserve.requestMovement(this.actingAs(admin, tenantId), dto, corr);
  }

  /**
   * Approval is a distinct permission from reserve:manage, so requesting and approving can be
   * held by different people. The service additionally refuses self-approval on identity.
   */
  @Post('reserve/movements/:id/approve')
  @RequireAdminPermission('reserve:approve')
  async approve(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Param('id') id: string,
  ) {
    return this.reserve.approveMovement(await this.authForMovement(admin, id), id, corr);
  }

  @Post('reserve/movements/:id/reject')
  @RequireAdminPermission('reserve:approve')
  async reject(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Param('id') id: string,
    @Body() dto: RejectMovementDto,
  ) {
    return this.reserve.rejectMovement(await this.authForMovement(admin, id), id, dto.reason, corr);
  }

  /**
   * The admin surface is cross-tenant, so the tenant is resolved from the movement itself and
   * then ABAC-checked — never taken from the caller.
   */
  private async authForMovement(admin: AdminContext, id: string): Promise<AuthContext> {
    const movement = await this.prisma.reserveMovement.findUnique({
      where: { id },
      select: { tenantId: true },
    });
    // A missing movement is left to the service's own NotFound handling rather than duplicated.
    return this.actingAs(admin, movement?.tenantId ?? 'unknown');
  }
}
