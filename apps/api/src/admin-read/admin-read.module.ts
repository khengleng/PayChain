import { Module } from '@nestjs/common';
import { ReadinessModule } from '../readiness/readiness.module';
import { StablecoinModule } from '../stablecoin/stablecoin.module';
import { AdminReadController } from './admin-read.controller';
import { AdminReadService } from './admin-read.service';
import { AdminActionsController } from './admin-actions.controller';
import { AdminActionsService } from './admin-actions.service';

/**
 * Admin console API (§37): read-only cross-tenant views (AdminReadController) plus
 * permission-gated privileged writes (AdminActionsController). Imports StablecoinModule to
 * reuse TreasuryService's maker-checker for admin-side treasury approvals.
 */
@Module({
  imports: [StablecoinModule, ReadinessModule],
  controllers: [AdminReadController, AdminActionsController],
  providers: [AdminReadService, AdminActionsService],
})
export class AdminReadModule {}
