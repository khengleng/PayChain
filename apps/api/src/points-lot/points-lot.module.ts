import { Global, Module } from '@nestjs/common';
import { PointsLotService } from './points-lot.service';

/**
 * Global so every burn path (assets, spend, exchange, conversion, redemption) can draw down the
 * points-lot ledger without threading module imports. Depends only on the (global) PrismaService.
 */
@Global()
@Module({
  providers: [PointsLotService],
  exports: [PointsLotService],
})
export class PointsLotModule {}
