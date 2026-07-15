import { Injectable } from '@nestjs/common';
import type { MonitoringAlert } from '@paychain/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthContext } from '../auth/auth-context';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface MonitoringInput {
  subjectType: string; // e.g. 'wallet' | 'transaction'
  subjectReference: string;
  amount?: string;
  country?: string;
  sanctionsMatch?: boolean;
  velocityCount?: number; // txns in the recent window
}

export interface RuleHit {
  ruleKey: string;
  severity: Severity;
  reason: string;
}

const HIGH_RISK_COUNTRIES = ['KP', 'IR', 'SY'];
const STRUCTURING_THRESHOLD = 10000;
const LARGE_AMOUNT = 100000;
const VELOCITY_LIMIT = 20;

/**
 * Pure monitoring rules (§29) — deterministic and unit-testable. Real deployments add more
 * rules (circular transfers, dormant-wallet activation, etc.); this is the M4 foundation.
 */
export function runRules(input: MonitoringInput): RuleHit[] {
  const hits: RuleHit[] = [];
  const amount = input.amount ? Number(input.amount) : 0;

  if (input.sanctionsMatch) {
    hits.push({ ruleKey: 'sanctions_match', severity: 'CRITICAL', reason: 'Counterparty matched a sanctions list' });
  }
  if (input.country && HIGH_RISK_COUNTRIES.includes(input.country.toUpperCase())) {
    hits.push({ ruleKey: 'high_risk_jurisdiction', severity: 'HIGH', reason: `High-risk jurisdiction: ${input.country}` });
  }
  if (amount >= LARGE_AMOUNT) {
    hits.push({ ruleKey: 'large_amount', severity: 'HIGH', reason: `Amount ${amount} exceeds large-amount threshold` });
  } else if (amount >= STRUCTURING_THRESHOLD * 0.9 && amount < STRUCTURING_THRESHOLD) {
    hits.push({ ruleKey: 'structuring', severity: 'MEDIUM', reason: 'Amount just below a reporting threshold' });
  }
  if (input.velocityCount && input.velocityCount > VELOCITY_LIMIT) {
    hits.push({ ruleKey: 'velocity', severity: 'MEDIUM', reason: `High transaction velocity: ${input.velocityCount}` });
  }
  return hits;
}

@Injectable()
export class MonitoringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Evaluates monitoring rules and records alerts. A CRITICAL hit applies an automated hold
   * (§29) — but never silently: every alert and hold records a reason and an audit event.
   */
  async evaluate(
    auth: AuthContext,
    input: MonitoringInput,
    correlationId?: string,
  ): Promise<{ alerts: MonitoringAlert[]; holds: number }> {
    const hits = runRules(input);
    const created: MonitoringAlert[] = [];
    for (const hit of hits) {
      const holdApplied = hit.severity === 'CRITICAL';
      const alert = await this.prisma.monitoringAlert.create({
        data: {
          tenantId: auth.tenantId,
          ruleKey: hit.ruleKey,
          severity: hit.severity,
          status: holdApplied ? 'HELD' : 'OPEN',
          subjectType: input.subjectType,
          subjectReference: input.subjectReference,
          reason: hit.reason,
          holdApplied,
          detail: { amount: input.amount, country: input.country },
          correlationId,
        },
      });
      await this.audit.record({
        tenantId: auth.tenantId,
        actor: auth.clientId,
        action: holdApplied ? 'monitoring.alert.hold' : 'monitoring.alert.open',
        resourceType: 'monitoring_alert',
        resourceId: alert.id,
        correlationId,
        metadata: { ruleKey: hit.ruleKey, severity: hit.severity, reason: hit.reason },
      });
      created.push(alert);
    }
    return { alerts: created, holds: created.filter((a) => a.holdApplied).length };
  }

  async list(auth: AuthContext): Promise<MonitoringAlert[]> {
    return this.prisma.monitoringAlert.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
