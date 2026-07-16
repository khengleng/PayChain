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
