import { Global, Module } from '@nestjs/common';
import {
  FailoverBlockchainProvider,
  type BlockchainProvider,
  type NamedProvider,
} from '@paychain/blockchain';
import type { PayChainConfig } from '@paychain/config';
import { StellarProvider } from '@paychain/stellar';
import { CONFIG } from '../config/config.module';

export const BLOCKCHAIN_PROVIDER = Symbol('BLOCKCHAIN_PROVIDER');

/**
 * Binds the blockchain provider to the provider-agnostic token (§9). The concrete Stellar
 * provider is wrapped in a FailoverBlockchainProvider with circuit breakers + timeouts (§40):
 * the primary RPC/Horizon endpoint is tried first, then the optional secondary. Business
 * modules inject BLOCKCHAIN_PROVIDER and never see the Stellar SDK or the failover logic.
 */
@Global()
@Module({
  providers: [
    {
      provide: BLOCKCHAIN_PROVIDER,
      inject: [CONFIG],
      useFactory: (cfg: PayChainConfig): BlockchainProvider => {
        const makeStellar = (horizonUrl: string) =>
          new StellarProvider({
            network: cfg.STELLAR_NETWORK,
            horizonUrl,
            networkPassphrase: cfg.STELLAR_NETWORK_PASSPHRASE,
            friendbotUrl: cfg.STELLAR_FRIENDBOT_URL || undefined,
            // When set, wallets are created with sponsored reserves instead of friendbot (§10).
            // These were previously declared in config and read by nothing.
            sponsorPublicKey: cfg.STELLAR_SPONSOR_PUBLIC_KEY || undefined,
            sponsorSecretKey: cfg.STELLAR_SPONSOR_SECRET_KEY || undefined,
          });

        const providers: NamedProvider[] = [
          { name: 'stellar-primary', provider: makeStellar(cfg.STELLAR_HORIZON_URL) },
        ];
        if (cfg.STELLAR_RPC_SECONDARY_URL) {
          providers.push({ name: 'stellar-secondary', provider: makeStellar(cfg.STELLAR_RPC_SECONDARY_URL) });
        }
        return new FailoverBlockchainProvider(providers, {
          timeoutMs: 20_000,
          circuit: { failureThreshold: 5, resetTimeoutMs: 30_000 },
        });
      },
    },
  ],
  exports: [BLOCKCHAIN_PROVIDER],
})
export class BlockchainModule {}
