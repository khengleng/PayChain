import { Module } from '@nestjs/common';
import { WalletsModule } from '../wallets/wallets.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { StablecoinModule } from '../stablecoin/stablecoin.module';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';

@Module({
  // StablecoinModule provides MonitoringService (§29). No cycle: StablecoinModule imports only
  // providers + WalletsModule.
  imports: [WalletsModule, WebhooksModule, StablecoinModule],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
