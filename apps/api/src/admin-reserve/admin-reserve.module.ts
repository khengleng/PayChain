import { Module } from '@nestjs/common';
import { StablecoinModule } from '../stablecoin/stablecoin.module';
import { AdminReserveController } from './admin-reserve.controller';

/** Reuses ReserveService rather than duplicating maker-checker logic in an admin variant. */
@Module({
  imports: [StablecoinModule],
  controllers: [AdminReserveController],
})
export class AdminReserveModule {}
