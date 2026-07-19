import { Module } from '@nestjs/common';
import { AdminTenantsModule } from '../admin-tenants/admin-tenants.module';
import { AdminClientsModule } from '../admin-clients/admin-clients.module';
import { PartnerController } from './partner.controller';
import { PartnerService } from './partner.service';
import { PartnerAuthGuard } from './partner-auth.guard';
import { AdminPartnerController } from './admin-partner.controller';
import { AdminPartnerService } from './admin-partner.service';

/**
 * Self-service partner onboarding: public registration + partner login (PartnerController) and the
 * admin review queue (AdminPartnerController). Provisioning on approval reuses AdminTenantsService +
 * AdminClientsService. JwtService, PrismaService, AuditService, MailerService and CONFIG all come
 * from @Global() modules.
 */
@Module({
  imports: [AdminTenantsModule, AdminClientsModule],
  controllers: [PartnerController, AdminPartnerController],
  providers: [PartnerService, PartnerAuthGuard, AdminPartnerService],
})
export class PartnerModule {}
