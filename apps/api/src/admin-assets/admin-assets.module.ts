import { Module } from '@nestjs/common';
import { AssetsModule } from '../assets/assets.module';
import { AdminAssetsController } from './admin-assets.controller';

/** Reuses AssetsService rather than duplicating issuance/lifecycle logic in an admin variant. */
@Module({
  imports: [AssetsModule],
  controllers: [AdminAssetsController],
})
export class AdminAssetsModule {}
