import { Module } from '@nestjs/common';
import { TrusteeController } from './trustee.controller';
import { TrusteeService } from './trustee.service';

/**
 * Inbound receiver for the external trustee platform's outbound webhooks (§35 signing scheme).
 * AuditService, IdempotencyService and CONFIG are all provided by @Global() modules, so this
 * module only needs to declare its own controller and service.
 */
@Module({
  controllers: [TrusteeController],
  providers: [TrusteeService],
})
export class TrusteeModule {}
