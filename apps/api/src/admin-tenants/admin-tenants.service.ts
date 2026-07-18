import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { TenantStatus, TenantType } from '@paychain/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { assertPermittedByAttributes } from '../admin-auth/abac';
import type { AdminContext } from '../admin-auth/admin-context';

export interface TenantView {
  id: string;
  name: string;
  type: TenantType;
  parentTenantId: string | null;
  parentTenantName: string | null;
  status: TenantStatus;
  createdAt: Date;
  childTenants: number;
  apiClients: number;
  wallets: number;
  assets: number;
}

export interface RetailerTenantView extends TenantView {
  wholesalerTenantId: string;
  wholesalerTenantName: string;
  requestCount24h: number;
  errorCount24h: number;
  failedAuthAttempts24h: number;
  lastApiRequestAt: Date | null;
  lastFailedAuthAt: Date | null;
}

export interface WholesalerRetailersView {
  wholesaler: TenantView;
  summary: {
    retailers: number;
    apiClients: number;
    wallets: number;
    assets: number;
    requestCount24h: number;
    errorCount24h: number;
    failedAuthAttempts24h: number;
  };
  items: RetailerTenantView[];
}

/**
 * Tenant provisioning (§7).
 *
 * `tenant:write` existed in the permission catalog from the start and was used by nothing: the
 * only writer of the tenants table was the dev seed script, so onboarding a partner in production
 * meant inserting a row by hand — unaudited and unattributable. This is the first half of
 * onboarding; issuing that tenant's API credentials (AdminClientsService) is the second.
 */
@Injectable()
export class AdminTenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Shape matches the previous admin-read endpoint this replaces, so the console is unaffected. */
  async list(admin: AdminContext): Promise<{ items: TenantView[] }> {
    const rows = await this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        parentTenant: { select: { id: true, name: true } },
        _count: { select: { apiClients: true, wallets: true, assets: true, childTenants: true } },
      },
    });
    // Tenant-scoped admins see only their tenants. Reads elsewhere are not yet ABAC-filtered
    // (see the gap register); doing it here keeps the new surface honest rather than adding to
    // the problem.
    const items = rows
      .filter((t) => isPermitted(admin, t.id))
      .map((t) => this.toTenantView(t));
    return { items };
  }

  async create(
    admin: AdminContext,
    input: { name: string; type?: TenantType; parentTenantId?: string },
    correlationId: string,
  ) {
    const name = input.name.trim();
    const type = input.type ?? defaultTypeFor(admin);

    // Tenant names are how an operator identifies who they are granting credentials to; two
    // "PayKH Sandbox" rows is a mis-issuance waiting to happen.
    const existing = await this.prisma.tenant.findFirst({ where: { name } });
    if (existing) {
      throw new ConflictException(`A tenant named "${name}" already exists`);
    }

    const parent = input.parentTenantId
      ? await this.prisma.tenant.findUnique({ where: { id: input.parentTenantId } })
      : null;
    if (input.parentTenantId && !parent) {
      throw new NotFoundException('Parent tenant not found');
    }
    if (parent) {
      assertPermittedByAttributes(admin, { tenantId: parent.id });
    }
    if (type === 'RETAILER' && !parent) {
      throw new ConflictException('A retailer tenant must belong to a wholesaler tenant');
    }
    if (type !== 'RETAILER' && parent) {
      throw new ConflictException('Only retailer tenants may be created under a parent tenant');
    }
    if (type === 'RETAILER' && parent?.type !== 'WHOLESALER') {
      throw new ConflictException('Retailer tenants may only be created under a WHOLESALER tenant');
    }
    if (admin.role === 'WHOLESALE_ADMIN') {
      if (type !== 'RETAILER' || !parent) {
        throw new ForbiddenException(
          'WHOLESALE_ADMIN may only provision downstream retailer tenants under an allowed parent tenant',
        );
      }
    }

    const tenant = await this.prisma.tenant.create({
      data: { name, type, parentTenantId: parent?.id ?? null },
    });

    await this.audit.record({
      tenantId: tenant.id,
      actor: admin.email,
      action: 'tenant.created',
      resourceType: 'tenant',
      resourceId: tenant.id,
      correlationId,
      metadata: {
        name,
        type,
        parentTenantId: parent?.id ?? null,
        parentTenantName: parent?.name ?? null,
        role: admin.role,
      },
    });

    return tenant;
  }

  async retailers(admin: AdminContext, wholesalerTenantId: string): Promise<WholesalerRetailersView> {
    const wholesaler = await this.prisma.tenant.findUnique({
      where: { id: wholesalerTenantId },
      include: {
        parentTenant: { select: { id: true, name: true } },
        _count: { select: { childTenants: true, apiClients: true, wallets: true, assets: true } },
      },
    });
    if (!wholesaler) throw new NotFoundException('Tenant not found');
    assertPermittedByAttributes(admin, { tenantId: wholesaler.id });
    if (wholesaler.type !== 'WHOLESALER') {
      throw new ConflictException('Only WHOLESALER tenants have downstream retailer management');
    }

    const rows = await this.prisma.tenant.findMany({
      where: { parentTenantId: wholesaler.id, type: 'RETAILER' },
      orderBy: { createdAt: 'desc' },
      include: {
        parentTenant: { select: { id: true, name: true } },
        _count: { select: { childTenants: true, apiClients: true, wallets: true, assets: true } },
      },
    });
    const items = await this.withRetailerUsage(rows, wholesaler);
    return {
      wholesaler: this.toTenantView(wholesaler),
      summary: {
        retailers: items.length,
        apiClients: items.reduce((sum, item) => sum + item.apiClients, 0),
        wallets: items.reduce((sum, item) => sum + item.wallets, 0),
        assets: items.reduce((sum, item) => sum + item.assets, 0),
        requestCount24h: items.reduce((sum, item) => sum + item.requestCount24h, 0),
        errorCount24h: items.reduce((sum, item) => sum + item.errorCount24h, 0),
        failedAuthAttempts24h: items.reduce((sum, item) => sum + item.failedAuthAttempts24h, 0),
      },
      items,
    };
  }

  async createRetailer(
    admin: AdminContext,
    wholesalerTenantId: string,
    input: { name: string },
    correlationId: string,
  ) {
    return this.create(
      admin,
      { name: input.name, type: 'RETAILER', parentTenantId: wholesalerTenantId },
      correlationId,
    );
  }

  async setStatus(
    admin: AdminContext,
    tenantId: string,
    status: TenantStatus,
    correlationId: string,
  ) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    assertPermittedByAttributes(admin, { tenantId });
    if (tenant.status === status) {
      throw new ConflictException(`Tenant is already ${status}`);
    }

    const updated = await this.prisma.tenant.update({ where: { id: tenantId }, data: { status } });

    await this.audit.record({
      tenantId,
      actor: admin.email,
      action: 'tenant.status_changed',
      resourceType: 'tenant',
      resourceId: tenantId,
      correlationId,
      metadata: { name: tenant.name, from: tenant.status, to: status, role: admin.role },
    });

    return updated;
  }

  private toTenantView(tenant: TenantWithCounts): TenantView {
    return {
      id: tenant.id,
      name: tenant.name,
      type: tenant.type,
      parentTenantId: tenant.parentTenantId,
      parentTenantName: tenant.parentTenant?.name ?? null,
      status: tenant.status,
      createdAt: tenant.createdAt,
      childTenants: tenant._count.childTenants,
      apiClients: tenant._count.apiClients,
      wallets: tenant._count.wallets,
      assets: tenant._count.assets,
    };
  }

  private toRetailerView(
    tenant: TenantWithCounts,
    wholesaler: TenantWithCounts,
  ): RetailerTenantView {
    return {
      ...this.toTenantView(tenant),
      wholesalerTenantId: wholesaler.id,
      wholesalerTenantName: wholesaler.name,
      requestCount24h: 0,
      errorCount24h: 0,
      failedAuthAttempts24h: 0,
      lastApiRequestAt: null,
      lastFailedAuthAt: null,
    };
  }

  private async withRetailerUsage(
    rows: TenantWithCounts[],
    wholesaler: TenantWithCounts,
  ): Promise<RetailerTenantView[]> {
    if (rows.length === 0) return [];
    const tenantIds = rows.map((row) => row.id);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [counts24h, errors24h, failedAuths24h, lastRequests, lastFailedAuths] = await Promise.all([
      this.prisma.apiClientRequestLog.groupBy({
        by: ['tenantId'],
        where: { tenantId: { in: tenantIds }, createdAt: { gte: since } },
        _count: { _all: true },
      }),
      this.prisma.apiClientRequestLog.groupBy({
        by: ['tenantId'],
        where: { tenantId: { in: tenantIds }, createdAt: { gte: since }, statusCode: { gte: 400 } },
        _count: { _all: true },
      }),
      this.prisma.apiClientAuthAttempt.groupBy({
        by: ['tenantId'],
        where: {
          tenantId: { in: tenantIds, not: null },
          createdAt: { gte: since },
          success: false,
        },
        _count: { _all: true },
      }),
      this.prisma.apiClientRequestLog.groupBy({
        by: ['tenantId'],
        where: { tenantId: { in: tenantIds } },
        _max: { createdAt: true },
      }),
      this.prisma.apiClientAuthAttempt.groupBy({
        by: ['tenantId'],
        where: { tenantId: { in: tenantIds, not: null }, success: false },
        _max: { createdAt: true },
      }),
    ]);
    const requestCountById = new Map(counts24h.map((row) => [row.tenantId, row._count._all]));
    const errorCountById = new Map(errors24h.map((row) => [row.tenantId, row._count._all]));
    const failedAuthCountById = new Map(failedAuths24h.map((row) => [row.tenantId!, row._count._all]));
    const lastRequestById = new Map(lastRequests.map((row) => [row.tenantId, row._max.createdAt ?? null]));
    const lastFailedAuthById = new Map(lastFailedAuths.map((row) => [row.tenantId!, row._max.createdAt ?? null]));

    return rows.map((tenant) => ({
      ...this.toRetailerView(tenant, wholesaler),
      requestCount24h: requestCountById.get(tenant.id) ?? 0,
      errorCount24h: errorCountById.get(tenant.id) ?? 0,
      failedAuthAttempts24h: failedAuthCountById.get(tenant.id) ?? 0,
      lastApiRequestAt: lastRequestById.get(tenant.id) ?? null,
      lastFailedAuthAt: lastFailedAuthById.get(tenant.id) ?? null,
    }));
  }
}

/** A tenant-scoped WHOLESALE_ADMIN creates retailers by default; platform roles create direct tenants by default. */
function defaultTypeFor(admin: AdminContext): TenantType {
  return admin.role === 'WHOLESALE_ADMIN' ? 'RETAILER' : 'DIRECT';
}

/** Non-throwing ABAC check, for filtering lists rather than refusing a single resource. */
function isPermitted(admin: AdminContext, tenantId: string): boolean {
  const tenants = admin.attributes?.tenants;
  if (!Array.isArray(tenants) || tenants.length === 0) return true; // unscoped
  return (tenants as string[]).includes(tenantId);
}

type TenantWithCounts = Awaited<ReturnType<PrismaService['tenant']['findFirst']>> & {
  _count: { childTenants: number; apiClients: number; wallets: number; assets: number };
  parentTenant?: { id: string; name: string } | null;
};
