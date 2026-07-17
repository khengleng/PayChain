import { Module } from '@nestjs/common';
import { AdminWalletPolicyController } from './admin-wallet-policy.controller';

/** §27 wallet policy administration — the write path for the default-deny stablecoin guard. */
@Module({ controllers: [AdminWalletPolicyController] })
export class AdminWalletsModule {}
