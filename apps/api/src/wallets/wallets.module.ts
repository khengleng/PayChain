import { Module } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { WalletPolicyService } from './wallet-policy.service';
import { EscrowService } from './escrow.service';

@Module({
  controllers: [WalletsController],
  providers: [WalletsService, BalanceService, WalletPolicyService, EscrowService],
  // WalletPolicyService is exported for the stablecoin sagas: §27's controls must be enforced by
  // the value paths, not re-implemented next to them.
  exports: [WalletsService, BalanceService, WalletPolicyService, EscrowService],
})
export class WalletsModule {}
