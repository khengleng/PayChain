/**
 * Future PayKH stablecoin capability surface (§22, §44) — DESIGNED but DISABLED. Every method
 * is defined so the PayKH UI/flows can be built against a stable interface, but they all refuse
 * until BOTH: (a) the PayKH-side feature flag is on, AND (b) PayChain's stablecoin readiness
 * gates pass. The first PayKH integration must remain loyalty-only.
 */
export class StablecoinFeaturesDisabledError extends Error {
  constructor(capability: string) {
    super(
      `PayKH stablecoin capability "${capability}" is disabled. It stays off until PayChain ` +
        `stablecoin readiness gates pass and PayKH enables the feature flag (§44).`,
    );
    this.name = 'StablecoinFeaturesDisabledError';
  }
}

export interface PayKhStablecoinCapabilities {
  displayStablecoinBalance(walletId: string): Promise<string>;
  requestConversionQuote(input: unknown): Promise<unknown>;
  convertPointsToStablecoin(input: unknown): Promise<unknown>;
  receiveStablecoin(input: unknown): Promise<unknown>;
  transferStablecoin(input: unknown): Promise<unknown>;
  redeemStablecoin(input: unknown): Promise<unknown>;
  getStablecoinTransactionHistory(walletId: string): Promise<unknown>;
  getComplianceStatus(walletId: string): Promise<unknown>;
  getWalletLimits(walletId: string): Promise<unknown>;
  getRedemptionStatus(redemptionId: string): Promise<unknown>;
}

/**
 * A no-op implementation whose every method throws unless `enabled` is true. This is the
 * guardrail that keeps the first PayKH integration loyalty-only.
 */
export class DisabledStablecoinFeatures implements PayKhStablecoinCapabilities {
  constructor(private readonly enabled = false) {}

  private guard(capability: string): Promise<never> {
    // Even when the PayKH flag is on, real calls still require PayChain server-side flags.
    const detail = this.enabled ? `${capability} (server flags still govern activation)` : capability;
    return Promise.reject(new StablecoinFeaturesDisabledError(detail));
  }

  displayStablecoinBalance(): Promise<string> {
    return this.guard('displayStablecoinBalance');
  }
  requestConversionQuote(): Promise<unknown> {
    return this.guard('requestConversionQuote');
  }
  convertPointsToStablecoin(): Promise<unknown> {
    return this.guard('convertPointsToStablecoin');
  }
  receiveStablecoin(): Promise<unknown> {
    return this.guard('receiveStablecoin');
  }
  transferStablecoin(): Promise<unknown> {
    return this.guard('transferStablecoin');
  }
  redeemStablecoin(): Promise<unknown> {
    return this.guard('redeemStablecoin');
  }
  getStablecoinTransactionHistory(): Promise<unknown> {
    return this.guard('getStablecoinTransactionHistory');
  }
  getComplianceStatus(): Promise<unknown> {
    return this.guard('getComplianceStatus');
  }
  getWalletLimits(): Promise<unknown> {
    return this.guard('getWalletLimits');
  }
  getRedemptionStatus(): Promise<unknown> {
    return this.guard('getRedemptionStatus');
  }
}
