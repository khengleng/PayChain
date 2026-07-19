import { Module } from '@nestjs/common';
import { StablecoinModule } from '../stablecoin/stablecoin.module';
import { TrusteeController } from './trustee.controller';
import { TrusteeService } from './trustee.service';
import { TrusteeKeyRegistry } from './trustee-key-registry.service';
import { TrusteeIpAllowlistGuard } from './trustee-ip-allowlist.guard';

/**
 * Inbound receiver for the external trustee platform's signed webhooks. AuditService,
 * IdempotencyService, PrismaService and CONFIG are provided by @Global() modules; StablecoinModule
 * is imported for ReserveService, which records trustee-corroborated reserve snapshots.
 */
@Module({
  imports: [StablecoinModule],
  controllers: [TrusteeController],
  providers: [TrusteeService, TrusteeKeyRegistry, TrusteeIpAllowlistGuard],
})
export class TrusteeModule {}
