import { ForbiddenException } from '@nestjs/common';
import type { AdminContext } from './admin-context';

/**
 * ABAC policy evaluation (§7 — do not authorize on role names alone). After RBAC confirms a
 * user HAS a permission, ABAC decides whether they may act on THIS resource based on the
 * user's attributes vs. the resource's attributes.
 *
 * Current attributes:
 *  - tenants: string[] — if present and non-empty, the user is scoped to those tenant ids.
 *  - region: string    — optional geographic scope.
 *  - clearance: number — optional minimum-clearance gate.
 */
export interface ResourceAttributes {
  tenantId?: string;
  region?: string;
  requiredClearance?: number;
}

export function isPermittedByAttributes(admin: AdminContext, resource: ResourceAttributes): boolean {
  const attrs = admin.attributes ?? {};

  const tenants = Array.isArray(attrs.tenants) ? (attrs.tenants as string[]) : undefined;
  if (tenants && tenants.length > 0 && resource.tenantId && !tenants.includes(resource.tenantId)) {
    return false;
  }

  if (resource.region && typeof attrs.region === 'string' && attrs.region !== resource.region) {
    return false;
  }

  if (resource.requiredClearance !== undefined) {
    const clearance = typeof attrs.clearance === 'number' ? attrs.clearance : 0;
    if (clearance < resource.requiredClearance) return false;
  }

  return true;
}

export function assertPermittedByAttributes(admin: AdminContext, resource: ResourceAttributes): void {
  if (!isPermittedByAttributes(admin, resource)) {
    throw new ForbiddenException('Your access attributes do not permit acting on this resource');
  }
}

/**
 * The tenant ids an admin is scoped to, or null when unscoped (all tenants).
 *
 * ABAC was write-only: assertPermittedByAttributes guarded freeze, flags and treasury approval,
 * while every read endpoint returned cross-tenant data regardless of scope. A tenant-A-scoped
 * AUDITOR or SUPPORT_ADMIN could read every tenant's wallets, transactions, reserves and
 * treasury — scoping that stops you changing another tenant's data but not seeing it is not
 * tenant isolation, and a regulator assessing data segregation would say so.
 *
 * Returns null rather than an empty array for "unscoped": an empty array must mean "nothing",
 * never "everything", or a mis-set attribute would silently grant total visibility.
 */
export function tenantScopeOf(admin: AdminContext): string[] | null {
  const tenants = admin.attributes?.tenants;
  if (!Array.isArray(tenants) || tenants.length === 0) return null;
  return tenants as string[];
}

/**
 * A Prisma `where` fragment applying an admin's tenant scope. Spread into a where clause:
 *   where: { ...tenantScopeWhere(scope), status: 'ACTIVE' }
 */
export function tenantScopeWhere(scope: string[] | null): { tenantId?: { in: string[] } } {
  return scope ? { tenantId: { in: scope } } : {};
}
