import { Module } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';

@Module({
  controllers: [WalletsController],
  providers: [WalletsService, BalanceService],
  exports: [WalletsService, BalanceService],
})
export class WalletsModule {}
