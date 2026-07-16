/**
 * The catalog of scopes an API client can be granted (§8, §34).
 *
 * These are TENANT-facing scopes (what a partner's integration may do), distinct from the admin
 * RBAC permissions in admin-auth/roles.ts (what a human operator may do). ScopesGuard checks a
 * handler's @RequireScopes against the `scopes` claim minted from the ApiClient record.
 *
 * Issuance validates against this list so a typo ("wallet.wirte") cannot be silently persisted
 * into a credential and then silently deny every request at runtime.
 */
export const API_SCOPES = [
  'wallet.read',
  'wallet.write',
  'asset.read',
  'asset.create',
  'asset.issue',
  'asset.transfer',
  'asset.burn',
  'transaction.read',
  'transaction.compensate',
  'transaction.approve',
  'webhook.manage',
  'stablecoin.read',
  'stablecoin.manage',
  'stablecoin.approve',
  'reserve.manage',
  'reserve.approve',
  'treasury.manage',
  'treasury.approve',
  'platform.readiness',
  'platform.emergency',
] as const;

export type ApiScope = (typeof API_SCOPES)[number];

/**
 * A sensible default for a loyalty integration (the PayKH shape, §44): create wallets, issue and
 * move points, read transactions, receive webhooks. Deliberately excludes every stablecoin,
 * reserve, treasury and platform scope — those are separately granted, never a default.
 */
export const LOYALTY_INTEGRATION_SCOPES: ApiScope[] = [
  'wallet.read',
  'wallet.write',
  'asset.read',
  'asset.issue',
  'asset.transfer',
  'asset.burn',
  'transaction.read',
  'webhook.manage',
];

/**
 * Scopes that let a client move or authorize value beyond ordinary loyalty traffic. Granting one
 * is flagged in the audit metadata so an approval trail exists for privileged credentials.
 */
export const SENSITIVE_SCOPES: ApiScope[] = [
  'transaction.compensate',
  'transaction.approve',
  'stablecoin.manage',
  'stablecoin.approve',
  'reserve.manage',
  'reserve.approve',
  'treasury.manage',
  'treasury.approve',
  'platform.readiness',
  'platform.emergency',
];

export function isApiScope(value: string): value is ApiScope {
  return (API_SCOPES as readonly string[]).includes(value);
}
