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
] as const;

export type StablecoinFlag = (typeof STABLECOIN_FLAGS)[number];

export const GLOBAL_TENANT = 'GLOBAL';
