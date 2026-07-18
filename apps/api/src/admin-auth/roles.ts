import type { AdminRole } from '@paychain/database';

/**
 * RBAC permission catalog + role→permission map (§8). Authorization checks a specific
 * permission, never a role name directly (§7). ABAC attributes (see abac.ts) further scope
 * what a permitted user may act on.
 */
export const PERMISSIONS = [
  'readiness:read',
  'readiness:write',
  'emergency:execute',
  'mainnet:enable',
  'tenant:read',
  'tenant:write',
  // API client issuance (§34). Separated from tenant:write because handing a partner a working
  // credential for a tenant is a materially different act from editing that tenant's record.
  'client:read',
  'client:write',
  'wallet:read',
  'wallet:freeze',
  // Granting a wallet stablecoin capability (§27) is a compliance decision, not an ops one —
  // separated from wallet:freeze so the two cannot be conflated.
  'wallet:policy',
  'asset:read',
  'asset:write',
  'stablecoin:read',
  'stablecoin:manage',
  'stablecoin:approve',
  'reserve:read',
  'reserve:manage',
  // Separate from reserve:manage so requesting and approving a reserve movement can be held by
  // different people — the whole point of maker-checker on the assets backing customer tokens.
  'reserve:approve',
  'treasury:read',
  'treasury:approve',
  'compliance:read',
  'compliance:manage',
  'reconciliation:read',
  'flags:read',
  'flags:write',
  'audit:read',
  'admin:manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL: Permission[] = [...PERMISSIONS];
const READ_ONLY: Permission[] = PERMISSIONS.filter((p) => p.endsWith(':read'));

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN: ALL,
  SECURITY_ADMIN: [
    'readiness:read',
    'readiness:write',
    'emergency:execute',
    'mainnet:enable',
    'flags:read',
    'flags:write',
    'wallet:read',
    'wallet:freeze',
    'audit:read',
    'admin:manage',
  ],
  OPERATIONS_ADMIN: [
    'readiness:read',
    'wallet:read',
    'wallet:freeze',
    'asset:read',
    'asset:write',
    'tenant:read',
    // Issues partner credentials — this is the role that onboards a tenant, so it needs to
    // create clients. It deliberately holds no treasury/reserve write permission.
    'client:read',
    'client:write',
    'reserve:read',
    'treasury:read',
    'reconciliation:read',
    'flags:read',
    'audit:read',
  ],
  WHOLESALE_ADMIN: [
    'tenant:read',
    'tenant:write',
    'client:read',
    'client:write',
    'wallet:read',
    'asset:read',
    'audit:read',
  ],
  COMPLIANCE_ADMIN: [
    'readiness:read',
    'compliance:read',
    'compliance:manage',
    'wallet:read',
    'wallet:freeze',
    'wallet:policy',
    'stablecoin:read',
    'audit:read',
  ],
  TREASURY_ADMIN: [
    'readiness:read',
    'treasury:read',
    'treasury:approve',
    'reserve:read',
    'reserve:manage',
    'reserve:approve',
    'stablecoin:read',
    'audit:read',
  ],
  SUPPORT_ADMIN: ['wallet:read', 'asset:read', 'tenant:read', 'audit:read'],
  AUDITOR: READ_ONLY,
};

export function permissionsForRole(role: AdminRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
