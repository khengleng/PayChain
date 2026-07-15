import { Module } from '@nestjs/common';
import { ReadinessController } from './readiness.controller';
import { ReadinessService } from './readiness.service';
import { EmergencyService } from './emergency.service';

@Module({
  controllers: [ReadinessController],
  providers: [ReadinessService, EmergencyService],
  exports: [ReadinessService],
})
export class ReadinessModule {}
