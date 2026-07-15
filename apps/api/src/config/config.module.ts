import { Global, Module } from '@nestjs/common';
import { loadConfig, type PayChainConfig } from '@paychain/config';

export const CONFIG = Symbol('PAYCHAIN_CONFIG');

/**
 * Loads and validates configuration once at boot and exposes it via the CONFIG token.
 * Fails fast (throws) if the environment is invalid.
 */
@Global()
@Module({
  providers: [{ provide: CONFIG, useFactory: (): PayChainConfig => loadConfig() }],
  exports: [CONFIG],
})
export class AppConfigModule {}
