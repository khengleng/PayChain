import { Module } from '@nestjs/common';
import { StablecoinController } from './stablecoin.controller';
import { StablecoinService } from './stablecoin.service';

@Module({
  controllers: [StablecoinController],
  providers: [StablecoinService],
})
export class StablecoinModule {}
