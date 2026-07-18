import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CorrelationId } from '../auth/auth-context';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { AdminPermissionGuard, RequireAdminPermission } from '../admin-auth/admin-permission.guard';
import { CurrentAdmin, type AdminContext } from '../admin-auth/admin-context';
import { AdminClientsService } from './admin-clients.service';
import { API_SCOPES, LOYALTY_INTEGRATION_SCOPES, SENSITIVE_SCOPES } from './api-scopes';
import { IssueClientDto, SetClientStatusDto, UpdateClientPolicyDto, UpdateScopesDto } from './dto';

/**
 * API client management (§34) — how a partner such as PayKH is given working credentials.
 *
 * Reads are `client:read`, writes are `client:write`, and every handler is ABAC-scoped to the
 * tenant in the service, so a tenant-scoped operator cannot issue credentials for someone else's
 * tenant. Issuing a credential is a privileged act: it is audited with the granted scopes and any
 * sensitive ones called out.
 */
@Controller('admin')
@UseGuards(AdminAuthGuard, AdminPermissionGuard)
export class AdminClientsController {
  constructor(private readonly clients: AdminClientsService) {}

  /** The scope catalog, so the console offers real scopes rather than a hardcoded copy. */
  @Get('client-scopes')
  @RequireAdminPermission('client:read')
  scopes() {
    return {
      scopes: API_SCOPES,
      sensitive: SENSITIVE_SCOPES,
      presets: {
        loyaltyIntegration: LOYALTY_INTEGRATION_SCOPES,
      },
    };
  }

  @Get('tenants/:tenantId/clients')
  @RequireAdminPermission('client:read')
  list(@CurrentAdmin() admin: AdminContext, @Param('tenantId') tenantId: string) {
    return this.clients.list(admin, tenantId);
  }

  /** Returns the secret exactly once — it is not stored and cannot be retrieved again. */
  @Post('tenants/:tenantId/clients')
  @RequireAdminPermission('client:write')
  issue(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Param('tenantId') tenantId: string,
    @Body() dto: IssueClientDto,
  ) {
    return this.clients.issue(admin, tenantId, dto, corr);
  }

  @Post('clients/:id/rotate-secret')
  @RequireAdminPermission('client:write')
  rotate(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Param('id') id: string,
  ) {
    return this.clients.rotateSecret(admin, id, corr);
  }

  @Post('clients/:id/status')
  @RequireAdminPermission('client:write')
  setStatus(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Param('id') id: string,
    @Body() dto: SetClientStatusDto,
  ) {
    return this.clients.setStatus(admin, id, dto.status, corr);
  }

  @Get('clients/:id/activity')
  @RequireAdminPermission('client:read')
  activity(
    @CurrentAdmin() admin: AdminContext,
    @Param('id') id: string,
  ) {
    return this.clients.activity(admin, id);
  }

  @Post('clients/:id/scopes')
  @RequireAdminPermission('client:write')
  updateScopes(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Param('id') id: string,
    @Body() dto: UpdateScopesDto,
  ) {
    return this.clients.updateScopes(admin, id, dto.scopes, corr);
  }

  @Post('clients/:id/policy')
  @RequireAdminPermission('client:write')
  updatePolicy(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Param('id') id: string,
    @Body() dto: UpdateClientPolicyDto,
  ) {
    return this.clients.updatePolicy(admin, id, dto, corr);
  }
}
