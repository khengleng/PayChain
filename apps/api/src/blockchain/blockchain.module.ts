import { Global, Module } from '@nestjs/common';
import IORedis from 'ioredis';
import {
  FailoverBlockchainProvider,
  RedisLock,
  type BlockchainProvider,
  type NamedProvider,
} from '@paychain/blockchain';
import type { PayChainConfig } from '@paychain/config';
import { StellarProvider, selectSigner } from '@paychain/stellar';
import { CONFIG } from '../config/config.module';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { GLOBAL_TENANT } from '../feature-flags/feature-flags.constants';
import { MainnetWriteGuardProvider } from './mainnet-write-guard.provider';

export const BLOCKCHAIN_PROVIDER = Symbol('BLOCKCHAIN_PROVIDER');

/**
 * Binds the blockchain provider to the provider-agnostic token (§9). The concrete Stellar
 * provider is wrapped in a FailoverBlockchainProvider with circuit breakers + timeouts (§40):
 * the primary RPC/Horizon endpoint is tried first, then the optional secondary. Business
 * modules inject BLOCKCHAIN_PROVIDER and never see the Stellar SDK or the failover logic.
 *
 * Submissions are serialized per Stellar source account through a Redis lock (§12). Redis rather
 * than in-process, because the API runs multiple instances and the worker submits from the same
 * accounts — an in-process lock would serialize one replica while the others still collided.
 */
@Global()
@Module({
  providers: [
    {
      provide: BLOCKCHAIN_PROVIDER,
      inject: [CONFIG, FeatureFlagsService],
      useFactory: (cfg: PayChainConfig, flags: FeatureFlagsService): BlockchainProvider => {
        // One connection shared by every provider instance: the lock is cheap and short-lived,
        // and a connection per Horizon endpoint would double it for no benefit.
        const redis = new IORedis(cfg.REDIS_URL, { maxRetriesPerRequest: null });
        const lock = new RedisLock(redis as never);
        // Every signature goes through this seam. local-dev signs in-process; a real HSM/KMS signer
        // is required (and config-enforced) before mainnet. Chosen once, shared by both instances.
        const signer = selectSigner(cfg.KEY_MANAGEMENT_PROVIDER);

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
            lock,
            signer,
          });

        const providers: NamedProvider[] = [
          { name: 'stellar-primary', provider: makeStellar(cfg.STELLAR_HORIZON_URL) },
        ];
        if (cfg.STELLAR_RPC_SECONDARY_URL) {
          providers.push({ name: 'stellar-secondary', provider: makeStellar(cfg.STELLAR_RPC_SECONDARY_URL) });
        }
        const failover = new FailoverBlockchainProvider(providers, {
          timeoutMs: 20_000,
          circuit: { failureThreshold: 5, resetTimeoutMs: 30_000 },
        });
        // §0.7 mainnet write gate: on mainnet, value movements are refused unless the readiness-gated
        // flag is on. Transparent pass-through off mainnet. The flag is a GLOBAL platform kill-switch.
        return new MainnetWriteGuardProvider(failover, cfg.STELLAR_NETWORK, () =>
          flags.isEnabled('stablecoin.mainnet.enabled', GLOBAL_TENANT),
        );
      },
    },
  ],
  exports: [BLOCKCHAIN_PROVIDER],
})
export class BlockchainModule {}
