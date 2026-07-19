import { Module } from '@nestjs/common';
import { StellarController } from './stellar.controller';
import { StellarService } from './stellar.service';

/**
 * Stellar network identity + health (mainnet-readiness). BLOCKCHAIN_PROVIDER is @Global; CONFIG is
 * provided app-wide, so this module only wires its own controller + service.
 */
@Module({
  controllers: [StellarController],
  providers: [StellarService],
})
export class StellarModule {}
