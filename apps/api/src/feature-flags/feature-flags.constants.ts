/**
 * Stablecoin feature flags (§36). Every production flag defaults to OFF and must be
 * explicitly enabled (behind approvals). Testnet may be enabled independently.
 */
export const STABLECOIN_FLAGS = [
  'stablecoin.module.enabled',
  'stablecoin.creation.enabled',
  'stablecoin.minting.enabled',
  'stablecoin.redemption.enabled',
  'stablecoin.transfer.enabled',
  'stablecoin.conversion.enabled',
  'stablecoin.mainnet.enabled',
  'stablecoin.public-wallets.enabled',
  'stablecoin.cross-border.enabled',
  'stablecoin.travel-rule.enabled',
  // When ON, a mint requires a VALID, matching trustee-signed mint authorization before it can
  // issue on-chain (§24). Default OFF: the receiver verifies and records authorizations regardless,
  // but enforcement is flipped on per tenant once the trustee is emitting signed authorizations.
  'stablecoin.trustee_authorization.required',
  // When ON, the reserve ratio uses the trustee's attested reserve figure (newest fresh
  // source='trustee' snapshot) as authoritative instead of the internal ledger sum; fail-closed to
  // a breach when no fresh trustee snapshot exists. Default OFF (§24 trustee reserve control).
  'stablecoin.trustee_reserve.authoritative',
] as const;

export type StablecoinFlag = (typeof STABLECOIN_FLAGS)[number];

export const GLOBAL_TENANT = 'GLOBAL';
