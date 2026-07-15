import { Module } from '@nestjs/common';
import { WalletsModule } from '../wallets/wallets.module';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';

@Module({
  imports: [WalletsModule],
  controllers: [AssetsController],
  providers: [AssetsService],
})
export class AssetsModule {}
