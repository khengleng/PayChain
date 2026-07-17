import { SandboxModule } from '../sandbox/sandbox.module';
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
import { AttestationService } from './attestation.service';

@Module({
  imports: [StablecoinProvidersModule, WalletsModule, SandboxModule],
  controllers: [StablecoinController, StablecoinWorkflowController],
  providers: [
    StablecoinService,
    ReserveService,
    MintService,
    RedemptionService,
    ConversionService,
    TreasuryService,
    MonitoringService,
    AttestationService,
  ],
  // ReserveService is exported for AdminReserveModule: the console operates the reserve through
  // the same maker-checker service as the tenant API, never a parallel implementation.
  // MonitoringService is exported for the asset value paths (§29): loyalty transfers and
  // redemptions must be screened by the same rules as stablecoin movements, not a second copy.
  // It lives here for historical reasons — it is not stablecoin-specific and would sit better in
  // its own module; noted rather than churned mid-fix.
  exports: [StablecoinService, TreasuryService, ReserveService, MonitoringService],
})
export class StablecoinModule {}
