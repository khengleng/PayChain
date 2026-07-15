/**
 * Loyalty rules engine (§20). Campaign logic lives here behind an interface — never
 * hard-coded in controllers — so earn rules can evolve (and later become tenant/DB-driven
 * campaigns) without touching the transaction pipeline.
 */

export interface EarnContext {
  /** Decimal string of spend in `currency`. */
  spendAmount: string;
  currency: string;
  merchantId?: string;
  /** ISO timestamp of the event; passed in explicitly for deterministic evaluation. */
  timestampIso: string;
}

export interface EarnResult {
  /** Whole loyalty points to award (decimal string, integer-valued). */
  points: string;
  appliedRules: string[];
}

export interface RuleEngine {
  evaluateEarn(ctx: EarnContext): EarnResult;
}

/** Config for the default engine. In a later milestone this becomes per-tenant/DB-backed. */
export interface EarnRuleConfig {
  /** Points earned per 1 unit of spend. */
  baseRatePerUnit: number;
  /** Multiplier applied on Saturday/Sunday (UTC). */
  weekendMultiplier?: number;
  /** Per-merchant multipliers keyed by merchantId. */
  merchantMultipliers?: Record<string, number>;
  /** Hard cap on points from a single earn event. */
  maxPointsPerEvent?: number;
}

export const DEFAULT_EARN_RULES: EarnRuleConfig = {
  baseRatePerUnit: 10,
  weekendMultiplier: 2,
  maxPointsPerEvent: 100_000,
};

/**
 * Deterministic, configurable earn engine. Points are whole numbers (floored). Every
 * multiplier that fires is recorded in appliedRules for auditability.
 */
export class ConfigRuleEngine implements RuleEngine {
  constructor(private readonly config: EarnRuleConfig) {}

  evaluateEarn(ctx: EarnContext): EarnResult {
    const spend = Number(ctx.spendAmount);
    if (!Number.isFinite(spend) || spend < 0) {
      throw new Error(`Invalid spendAmount: ${ctx.spendAmount}`);
    }
    const applied: string[] = ['base'];
    let points = spend * this.config.baseRatePerUnit;

    const day = new Date(ctx.timestampIso).getUTCDay();
    if (this.config.weekendMultiplier && (day === 0 || day === 6)) {
      points *= this.config.weekendMultiplier;
      applied.push('weekend');
    }

    const merchantMult = ctx.merchantId
      ? this.config.merchantMultipliers?.[ctx.merchantId]
      : undefined;
    if (merchantMult && merchantMult !== 1) {
      points *= merchantMult;
      applied.push(`merchant:${ctx.merchantId}`);
    }

    if (this.config.maxPointsPerEvent && points > this.config.maxPointsPerEvent) {
      points = this.config.maxPointsPerEvent;
      applied.push('cap');
    }

    return { points: String(Math.floor(points)), appliedRules: applied };
  }
}
