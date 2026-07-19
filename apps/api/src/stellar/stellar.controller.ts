import { Controller, Get, Header } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { StellarService } from './stellar.service';

/**
 * Public Stellar identity + health surface (mainnet-readiness, Phase 0).
 *
 * Both routes are public and unauthenticated: health is an ops probe, and stellar.toml is a SEP-1
 * discovery document wallets fetch anonymously. The stellar.toml route is EXCLUDED from the global
 * /api/v1 prefix in main.ts so it is served at the domain root (/.well-known/stellar.toml), as SEP-1
 * requires.
 */
@Controller()
@SkipThrottle()
export class StellarController {
  constructor(private readonly stellar: StellarService) {}

  @Get('stellar/health')
  health() {
    return this.stellar.health();
  }

  @Get('.well-known/stellar.toml')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  stellarToml(): string {
    return this.stellar.buildStellarToml();
  }
}
