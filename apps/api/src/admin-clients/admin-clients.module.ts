import { Module } from '@nestjs/common';
import { AdminClientsController } from './admin-clients.controller';
import { AdminClientsService } from './admin-clients.service';

@Module({
  controllers: [AdminClientsController],
  providers: [AdminClientsService],
  // Exported so partner onboarding can issue credentials through the same issuance path.
  exports: [AdminClientsService],
})
export class AdminClientsModule {}
