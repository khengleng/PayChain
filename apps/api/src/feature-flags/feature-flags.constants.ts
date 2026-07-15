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
] as const;

export type StablecoinFlag = (typeof STABLECOIN_FLAGS)[number];

export const GLOBAL_TENANT = 'GLOBAL';
