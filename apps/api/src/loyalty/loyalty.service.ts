import { Inject, Injectable } from '@nestjs/common';
import { AssetsService, type TransactionRecordView } from '../assets/assets.service';
import { AuditService } from '../audit/audit.service';
import type { AuthContext } from '../auth/auth-context';
import { RULE_ENGINE } from './loyalty.tokens';
import type { RuleEngine } from './rule-engine';
import type { EarnDto } from './dto';

export interface EarnResultView {
  points: string;
  appliedRules: string[];
  transaction: TransactionRecordView | null;
}

/**
 * Loyalty orchestration (§20). Earn evaluates the rules engine to compute points, then
 * issues them via the asset pipeline (which records the transaction and an expiry lot).
 * Campaign logic stays in the engine, never in the controller.
 */
@Injectable()
export class LoyaltyService {
  constructor(
    private readonly assets: AssetsService,
    private readonly audit: AuditService,
    @Inject(RULE_ENGINE) private readonly rules: RuleEngine,
  ) {}

  async earn(
    auth: AuthContext,
    assetId: string,
    dto: EarnDto,
    correlationId: string,
  ): Promise<EarnResultView> {
    const evaluation = this.rules.evaluateEarn({
      spendAmount: dto.spendAmount,
      currency: dto.currency,
      merchantId: dto.merchantId,
      timestampIso: new Date().toISOString(),
    });

    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'loyalty.earn.evaluated',
      resourceType: 'asset',
      resourceId: assetId,
      correlationId,
      metadata: {
        spendAmount: dto.spendAmount,
        currency: dto.currency,
        merchantId: dto.merchantId,
        points: evaluation.points,
        appliedRules: evaluation.appliedRules,
      },
    });

    if (evaluation.points === '0') {
      return { points: '0', appliedRules: evaluation.appliedRules, transaction: null };
    }

    const transaction = await this.assets.issue(
      auth,
      assetId,
      dto.walletId,
      evaluation.points,
      correlationId,
    );
    return { points: evaluation.points, appliedRules: evaluation.appliedRules, transaction };
  }
}
