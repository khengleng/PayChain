import { Module } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { WalletPolicyService } from './wallet-policy.service';

@Module({
  controllers: [WalletsController],
  providers: [WalletsService, BalanceService, WalletPolicyService],
  // WalletPolicyService is exported for the stablecoin sagas: §27's controls must be enforced by
  // the value paths, not re-implemented next to them.
  exports: [WalletsService, BalanceService, WalletPolicyService],
})
export class WalletsModule {}
