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
  // Narrow capability: provision a branded merchant coin (create only, in DRAFT). Deliberately
  // separate from stablecoin.manage so a merchant platform (PayKH) can create merchant coins
  // without controlling the lifecycle of every coin under its tenant.
  'stablecoin.provision',
  // Award loyalty points as a reserve-backed mint via POST /stablecoins/:id/earn — the automated,
  // single-call issuance path a loyalty platform (PayKH) uses per customer purchase. Below the
  // configured auto-approve threshold it mints without a human checker; every other control (reserve
  // sufficiency, trustee authorization, compliance, daily limit) still applies. Value-creating, so
  // separate from stablecoin.provision (create-only) and out of default presets.
  'stablecoin.earn',
  // Spend merchant points on goods: burns the customer's points (reducing supply) and frees the
  // backing reserve. Separate from stablecoin.manage so a point-of-sale integration can settle
  // purchases without holding mint/redeem/lifecycle authority.
  'stablecoin.spend',
  // Cross-peg exchange: swap one reserve-backed coin for another at a rate (burn source, mint
  // destination). Value-moving; kept separate from stablecoin.manage and out of default presets.
  'stablecoin.exchange',
  'reserve.read',
  'reserve.manage',
  'reserve.approve',
  'treasury.read',
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
 * Read-only trustee / verifier integration. Lets an external verifier inspect readiness,
 * stablecoin state, reserve evidence, and treasury history without granting any mutation path.
 */
export const TRUSTEE_INTEGRATION_SCOPES: ApiScope[] = [
  'stablecoin.read',
  'reserve.read',
  'treasury.read',
  'platform.readiness',
  'transaction.read',
];

/**
 * A merchant-platform integration (the PayKH shape for issuing merchant coins): the loyalty set
 * plus `stablecoin.provision`, so the platform can provision each merchant's branded, unit-valued
 * coin. It still cannot mint or manage stablecoin lifecycle — those stay separately gated.
 */
export const MERCHANT_PLATFORM_SCOPES: ApiScope[] = [
  ...LOYALTY_INTEGRATION_SCOPES,
  'stablecoin.provision',
  // Award reserve-backed points per purchase (the loop PayKH drives). Value-creating but the core
  // of the merchant-platform flow, so included here; still gated by the reserve/trustee/compliance
  // controls and the auto-approve threshold.
  'stablecoin.earn',
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
  'stablecoin.provision',
  'stablecoin.earn',
  'stablecoin.spend',
  'stablecoin.exchange',
  'reserve.read',
  'reserve.manage',
  'reserve.approve',
  'treasury.read',
  'treasury.manage',
  'treasury.approve',
  'platform.readiness',
  'platform.emergency',
];

export function isApiScope(value: string): value is ApiScope {
  return (API_SCOPES as readonly string[]).includes(value);
}
