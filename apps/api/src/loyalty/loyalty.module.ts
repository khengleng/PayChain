import { Module } from '@nestjs/common';
import { AssetsModule } from '../assets/assets.module';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import { RULE_ENGINE } from './loyalty.tokens';
import { ConfigRuleEngine, DEFAULT_EARN_RULES } from './rule-engine';

@Module({
  imports: [AssetsModule],
  controllers: [LoyaltyController],
  providers: [
    LoyaltyService,
    // Default config-driven rules engine (§20). Swappable for a tenant/DB-backed engine.
    { provide: RULE_ENGINE, useFactory: () => new ConfigRuleEngine(DEFAULT_EARN_RULES) },
  ],
})
export class LoyaltyModule {}
