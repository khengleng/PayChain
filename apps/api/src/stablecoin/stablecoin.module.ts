import { Module } from '@nestjs/common';
import { StablecoinProvidersModule } from './providers/providers.module';
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
  imports: [StablecoinProvidersModule],
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
})
export class StablecoinModule {}
