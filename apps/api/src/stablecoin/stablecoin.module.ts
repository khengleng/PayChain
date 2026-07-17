import { Module } from '@nestjs/common';
import { StablecoinProvidersModule } from './providers/providers.module';
import { WalletsModule } from '../wallets/wallets.module';
import { StablecoinController } from './stablecoin.controller';
import { StablecoinService } from './stablecoin.service';
import { StablecoinWorkflowController } from './workflow.controller';
import { ReserveService } from './reserve.service';
import { MintService } from './mint.service';
import { RedemptionService } from './redemption.service';
import { ConversionService } from './conversion.service';
import { TreasuryService } from './treasury.service';
import { MonitoringService } from './monitoring.service';

@Module({
  imports: [StablecoinProvidersModule, WalletsModule],
  controllers: [StablecoinController, StablecoinWorkflowController],
  providers: [
    StablecoinService,
    ReserveService,
    MintService,
    RedemptionService,
    ConversionService,
    TreasuryService,
    MonitoringService,
  ],
  // ReserveService is exported for AdminReserveModule: the console operates the reserve through
  // the same maker-checker service as the tenant API, never a parallel implementation.
  exports: [TreasuryService, ReserveService],
})
export class StablecoinModule {}
