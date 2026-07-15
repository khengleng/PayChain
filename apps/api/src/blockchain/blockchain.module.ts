import { Global, Module } from '@nestjs/common';
import type { BlockchainProvider } from '@paychain/blockchain';
import type { PayChainConfig } from '@paychain/config';
import { StellarProvider } from '@paychain/stellar';
import { CONFIG } from '../config/config.module';

export const BLOCKCHAIN_PROVIDER = Symbol('BLOCKCHAIN_PROVIDER');

/**
 * Binds the concrete Stellar provider to the provider-agnostic token (§9).
 * Business modules inject BLOCKCHAIN_PROVIDER and never see the Stellar SDK.
 * Swapping providers or adding failover happens here only.
 */
@Global()
@Module({
  providers: [
    {
      provide: BLOCKCHAIN_PROVIDER,
      inject: [CONFIG],
      useFactory: (cfg: PayChainConfig): BlockchainProvider =>
        new StellarProvider({
          network: cfg.STELLAR_NETWORK,
          horizonUrl: cfg.STELLAR_HORIZON_URL,
          networkPassphrase: cfg.STELLAR_NETWORK_PASSPHRASE,
          friendbotUrl: cfg.STELLAR_FRIENDBOT_URL || undefined,
        }),
    },
  ],
  exports: [BLOCKCHAIN_PROVIDER],
})
export class BlockchainModule {}
