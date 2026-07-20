import {
  FailoverBlockchainProvider,
  type BlockchainProvider,
  type NamedProvider,
} from '@paychain/blockchain';
import type { PayChainConfig } from '@paychain/config';
import { StellarProvider, selectSigner } from '@paychain/stellar';
import { EvmProvider, ViemChainClient } from '@paychain/evm';

/**
 * Builds the provider-agnostic blockchain client for the worker (§9), wrapped in failover
 * with circuit breakers + timeouts (§40) so a degraded RPC endpoint fails fast rather than
 * hanging background jobs.
 */
export function createChainProvider(cfg: PayChainConfig): BlockchainProvider {
  // Custodial EVM (Base) track — mirror of the API wiring. Config keeps Base mainnet fail-closed,
  // so Phase 1 is Base Sepolia only.
  if (cfg.BLOCKCHAIN_KIND === 'evm') {
    const makeEvm = (rpcUrl: string) =>
      new EvmProvider({
        network: cfg.EVM_CHAIN === 'base' ? 'mainnet' : 'testnet',
        client: new ViemChainClient({ rpcUrl, chainId: cfg.EVM_CHAIN_ID as number }),
        knownTokens: cfg.EVM_TOKEN_ADDRESS ? [{ address: cfg.EVM_TOKEN_ADDRESS, assetCode: cfg.EVM_TOKEN_CODE }] : [],
        confirmations: cfg.EVM_CONFIRMATIONS,
        gasFunderSecretKey: cfg.EVM_GAS_FUNDER_SECRET_KEY || undefined,
        gasDripWei: cfg.EVM_GAS_DRIP_WEI ? BigInt(cfg.EVM_GAS_DRIP_WEI) : undefined,
      });
    const evmProviders: NamedProvider[] = [{ name: 'evm-primary', provider: makeEvm(cfg.EVM_RPC_URL as string) }];
    if (cfg.EVM_RPC_SECONDARY_URL) {
      evmProviders.push({ name: 'evm-secondary', provider: makeEvm(cfg.EVM_RPC_SECONDARY_URL) });
    }
    return new FailoverBlockchainProvider(evmProviders, {
      timeoutMs: 20_000,
      circuit: { failureThreshold: 5, resetTimeoutMs: 30_000 },
    });
  }

  // Every signature goes through this seam. local-dev signs in-process; a real signer is required
  // (and config-enforced) before mainnet. Chosen once and shared by both provider instances.
  const signer = selectSigner(cfg.KEY_MANAGEMENT_PROVIDER);
  const makeStellar = (horizonUrl: string) =>
    new StellarProvider({
      network: cfg.STELLAR_NETWORK,
      horizonUrl,
      networkPassphrase: cfg.STELLAR_NETWORK_PASSPHRASE,
      friendbotUrl: cfg.STELLAR_FRIENDBOT_URL || undefined,
      signer,
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
}
