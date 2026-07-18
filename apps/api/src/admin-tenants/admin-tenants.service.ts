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
      .map((t) => ({
        id: t.id,
        name: t.name,
        type: t.type,
        parentTenantId: t.parentTenantId,
        parentTenantName: t.parentTenant?.name ?? null,
        status: t.status,
        createdAt: t.createdAt,
        childTenants: t._count.childTenants,
        apiClients: t._count.apiClients,
        wallets: t._count.wallets,
        assets: t._count.assets,
      }));
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
      throw new ConflictException('A retailer tenant must belong to a wholesaler or parent tenant');
    }
    if (type !== 'RETAILER' && parent) {
      throw new ConflictException('Only retailer tenants may be created under a parent tenant');
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
