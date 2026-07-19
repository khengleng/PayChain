import { Module } from '@nestjs/common';
import { AdminTenantsController } from './admin-tenants.controller';
import { AdminTenantsService } from './admin-tenants.service';

@Module({
  controllers: [AdminTenantsController],
  providers: [AdminTenantsService],
  // Exported so partner onboarding can provision a tenant through the same maker-checker/ABAC path.
  exports: [AdminTenantsService],
})
export class AdminTenantsModule {}
