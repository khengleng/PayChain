import { Module } from '@nestjs/common';
import { WalletsModule } from '../wallets/wallets.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { CompensationService } from './compensation.service';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [WalletsModule, WebhooksModule],
  controllers: [TransactionsController],
  providers: [CompensationService, TransactionsService],
})
export class TransactionsModule {}
