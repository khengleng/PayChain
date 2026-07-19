import { Inject, Injectable } from '@nestjs/common';
import type { PayChainConfig } from '@paychain/config';
import type { BlockchainProvider } from '@paychain/blockchain';
import { CONFIG } from '../config/config.module';
import { BLOCKCHAIN_PROVIDER } from '../blockchain/blockchain.module';

export interface StellarHealth {
  network: string;
  horizonConnected: boolean;
  latestLedger: number | null;
  /** true = account exists on-chain; false = configured but not found; null = not configured. */
  issuerAccountAvailable: boolean | null;
  distributionAccountAvailable: boolean | null;
  /** Phase 0: in-process dev signer. Phase 1 wires this to the external signer's health probe. */
  signingServiceAvailable: boolean;
  assetCode: string;
}

/**
 * Stellar network identity + operational health (mainnet-readiness, Phase 0).
 *
 * Read-only: reports connectivity and account availability, and publishes the platform's stellar.toml.
 * It holds no keys and moves no value — the fail-closed mainnet gate lives in config (a mainnet node
 * cannot boot with the in-process dev signer), and the value-write gate lands at the signer seam.
 */
@Injectable()
export class StellarService {
  constructor(
    @Inject(CONFIG) private readonly cfg: PayChainConfig,
    @Inject(BLOCKCHAIN_PROVIDER) private readonly chain: BlockchainProvider,
  ) {}

  async health(): Promise<StellarHealth> {
    const providerHealth = await this.chain.healthCheck().catch(() => ({ healthy: false, latestLedger: undefined }));
    const [issuer, distribution] = await Promise.all([
      this.accountAvailable(this.cfg.STELLAR_ISSUER_PUBLIC_KEY),
      this.accountAvailable(this.cfg.STELLAR_DISTRIBUTION_PUBLIC_KEY),
    ]);
    return {
      network: this.cfg.STELLAR_NETWORK,
      horizonConnected: providerHealth.healthy,
      latestLedger: providerHealth.latestLedger ?? null,
      issuerAccountAvailable: issuer,
      distributionAccountAvailable: distribution,
      // local-dev signs in-process, so signing is trivially "available". A mainnet node cannot boot
      // on local-dev (config fails closed), so this is only ever true off-mainnet in Phase 0.
      signingServiceAvailable: this.cfg.KEY_MANAGEMENT_PROVIDER === 'local-dev',
      assetCode: this.cfg.STELLAR_ASSET_CODE,
    };
  }

  /** null = not configured; true/false = configured account exists / does not exist on chain. */
  private async accountAvailable(publicKey?: string): Promise<boolean | null> {
    if (!publicKey) return null;
    try {
      await this.chain.getBalance({ publicKey });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * The SEP-1 stellar.toml served at the domain root. Built from config; public keys only.
   *
   * Anchoring / fiat-backing claims (`is_asset_anchored`, `anchor_asset`) are emitted ONLY when
   * STELLAR_ASSET_ANCHORED is explicitly 'true' — we do not assert stable value or fiat backing
   * before the legal, regulatory and trustee model is formally approved.
   */
  buildStellarToml(): string {
    const issuer = this.cfg.STELLAR_ISSUER_PUBLIC_KEY;
    const lines: string[] = [
      `NETWORK_PASSPHRASE="${this.cfg.STELLAR_NETWORK_PASSPHRASE}"`,
      '',
      '[DOCUMENTATION]',
      'ORG_NAME="PayChain"',
      `ORG_URL="${this.cfg.ADMIN_PORTAL_URL}"`,
      'ORG_DESCRIPTION="Digital value infrastructure supported by trustee-controlled reserve services."',
      'ORG_SUPPORT_EMAIL="support@cambobia.com"',
      '',
      '[[CURRENCIES]]',
      `code="${this.cfg.STELLAR_ASSET_CODE}"`,
      ...(issuer ? [`issuer="${issuer}"`] : []),
      'display_decimals=7',
      'name="PayChain Digital Value"',
      'desc="A reserve-controlled digital asset issued through PayChain."',
      'redemption_instructions="Redemption is subject to PayChain and trustee verification."',
      ...(this.cfg.STELLAR_ASSET_ANCHORED
        ? ['is_asset_anchored=true', 'anchor_asset_type="fiat"', 'anchor_asset="USD"']
        : []),
    ];
    return lines.join('\n') + '\n';
  }
}
