import { Module } from '@nestjs/common';
import { AdminClientsController } from './admin-clients.controller';
import { AdminClientsService } from './admin-clients.service';

@Module({
  controllers: [AdminClientsController],
  providers: [AdminClientsService],
})
export class AdminClientsModule {}
