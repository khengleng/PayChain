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
import { EvmProvider, ViemChainClient, mergeKnownTokens } from '@paychain/evm';
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

        // Custodial EVM (Base) track. Selected by BLOCKCHAIN_KIND='evm'; the config gate guarantees
        // an RPC + matching chainId and keeps Base mainnet fail-closed, so only Base Sepolia can boot
        // here in Phase 1 — no mainnet write-gate is required yet (that is a Phase-2 Base guard).
        if (cfg.BLOCKCHAIN_KIND === 'evm') {
          const makeEvm = (rpcUrl: string) =>
            new EvmProvider({
              network: cfg.EVM_CHAIN === 'base' ? 'mainnet' : 'testnet',
              client: new ViemChainClient({ rpcUrl, chainId: cfg.EVM_CHAIN_ID as number }),
              knownTokens: mergeKnownTokens(cfg.EVM_TOKEN_ADDRESS || undefined, cfg.EVM_TOKEN_CODE, cfg.EVM_TOKEN_ADDRESSES),
              confirmations: cfg.EVM_CONFIRMATIONS,
              gasFunderSecretKey: cfg.EVM_GAS_FUNDER_SECRET_KEY || undefined,
              gasDripWei: cfg.EVM_GAS_DRIP_WEI ? BigInt(cfg.EVM_GAS_DRIP_WEI) : undefined,
            });
          const evmProviders: NamedProvider[] = [
            { name: 'evm-primary', provider: makeEvm(cfg.EVM_RPC_URL as string) },
          ];
          if (cfg.EVM_RPC_SECONDARY_URL) {
            evmProviders.push({ name: 'evm-secondary', provider: makeEvm(cfg.EVM_RPC_SECONDARY_URL) });
          }
          return new FailoverBlockchainProvider(evmProviders, {
            timeoutMs: 20_000,
            circuit: { failureThreshold: 5, resetTimeoutMs: 30_000 },
          });
        }

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
