import { Controller, Get, Header, Query, UseGuards } from '@nestjs/common';
import { CorrelationId } from '../auth/auth-context';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { AdminPermissionGuard, RequireAdminPermission } from '../admin-auth/admin-permission.guard';
import { CurrentAdmin, type AdminContext } from '../admin-auth/admin-context';
import { tenantScopeOf } from '../admin-auth/abac';
import { AuditService } from './audit.service';
import { AuditExportService, type AuditQuery } from './audit-export.service';

/**
 * Auditor-facing audit trail surface (§41). Backs the evidence a regulator asks for: a filtered,
 * paginated trail; an independent verification of the hash chain; and an exportable package they
 * can re-verify offline.
 *
 * All three are `audit:read`, which the AUDITOR role holds (see roles.ts) — an auditor needs no
 * write permission and gets none. Reading the trail is itself audited: an export is a disclosure
 * of who-did-what across tenants, so it leaves its own entry in the chain.
 */
@Controller('admin/audit')
@UseGuards(AdminAuthGuard, AdminPermissionGuard)
export class AuditExportController {
  constructor(
    private readonly exports: AuditExportService,
    private readonly audit: AuditService,
  ) {}

  /** Filtered, cursor-paginated trail. Replaces the old unfiltered "most recent N" read. */
  @Get()
  @RequireAdminPermission('audit:read')
  query(@CurrentAdmin() admin: AdminContext, @Query() q: AuditQuery) {
    return this.exports.query(
      { ...q, limit: q.limit ? Number(q.limit) : undefined },
      tenantScopeOf(admin),
    );
  }

  /**
   * Recompute the chain and report the first break. This is the endpoint that answers an
   * auditor's "prove nobody edited this" — it is deliberately callable by them directly rather
   * than being a report we generate for them.
   */
  @Get('verify')
  @RequireAdminPermission('audit:read')
  verify() {
    return this.exports.verify();
  }

  /** Self-describing evidence package: rows + canonical pre-images + chain manifest. */
  @Get('export')
  @RequireAdminPermission('audit:read')
  async exportJson(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Query() q: AuditQuery,
  ) {
    const pkg = await this.exports.evidencePackage(
      { ...q, limit: q.limit ? Number(q.limit) : undefined },
      admin.email,
      tenantScopeOf(admin),
    );
    await this.audit.record({
      actor: admin.email,
      action: 'audit.exported',
      resourceType: 'audit_log',
      correlationId: corr,
      metadata: {
        format: 'json',
        filters: q,
        entryCount: pkg.manifest.entryCount,
        exportHash: pkg.manifest.exportHash,
      },
    });
    return pkg;
  }

  @Get('export.csv')
  @RequireAdminPermission('audit:read')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="paychain-audit-export.csv"')
  async exportCsv(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Query() q: AuditQuery,
  ) {
    const csv = await this.exports.csv(
      { ...q, limit: q.limit ? Number(q.limit) : undefined },
      tenantScopeOf(admin),
    );
    await this.audit.record({
      actor: admin.email,
      action: 'audit.exported',
      resourceType: 'audit_log',
      correlationId: corr,
      metadata: { format: 'csv', filters: q },
    });
    return csv;
  }
}
