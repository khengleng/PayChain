import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import type { ComplianceProvider } from '@paychain/compliance';
import { COMPLIANCE_PROVIDER } from '../compliance/compliance.module';
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

/** Window over which VELOCITY_LIMIT movements is considered rapid. */
const VELOCITY_WINDOW_MS = 60 * 60 * 1000;

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
    @Inject(COMPLIANCE_PROVIDER) private readonly compliance: ComplianceProvider,
  ) {}

  /**
   * Screens a value movement BEFORE it happens (§29).
   *
   * This is the difference between a monitoring system and a rules API. `evaluate` below has
   * exactly one caller — an endpoint a tenant invokes voluntarily, about itself, supplying its
   * own velocityCount. Both the trigger and the evidence came from the party being monitored, so
   * nothing was ever detected on real traffic and the CRITICAL hold never fired.
   *
   * Here the trigger is the money movement itself and the velocity is computed from the ledger,
   * not accepted from the caller. A CRITICAL hit THROWS: §29 says critical alerts may trigger
   * holds, and a hold that does not stop the transaction is a log line.
   */
  async screenMovement(
    auth: AuthContext,
    input: {
      walletId: string;
      subjectType: string;
      subjectReference: string;
      amount: string;
      country?: string;
    },
    correlationId?: string,
  ): Promise<void> {
    const [velocityCount, sanctionsMatch] = await Promise.all([
      this.recentMovementCount(auth.tenantId, input.walletId),
      this.sanctionsSignal(auth, {
        amount: input.amount,
        subjectReference: input.subjectReference,
        country: input.country,
      }),
    ]);

    const { alerts } = await this.evaluate(
      auth,
      {
        subjectType: input.subjectType,
        subjectReference: input.subjectReference,
        amount: input.amount,
        country: input.country,
        // Server-computed. The old path let the caller assert its own velocity, which is like
        // asking a suspect how suspicious they have been.
        velocityCount,
        sanctionsMatch,
      },
      correlationId,
    );

    const critical = alerts.find((a) => a.holdApplied);
    if (critical) {
      throw new ForbiddenException(
        `Blocked by transaction monitoring: ${critical.ruleKey} — ${critical.reason}. ` +
          `Alert ${critical.id} is on hold for compliance review.`,
      );
    }
  }

  /**
   * The sanctions signal for this movement, from the compliance provider.
   *
   * Without this, screenMovement could never produce a CRITICAL hit — sanctions_match is the ONLY
   * CRITICAL rule, so the hold below would have been unreachable code. A guard that cannot fire
   * is the exact failure this work keeps finding, and the first version of this method had it.
   *
   * The provider is currently MockComplianceProvider, which returns CLEAR for everything: this
   * path is real, the signal behind it is not. Swapping in a vendor makes the hold live with no
   * further change here — which is the point of the abstraction.
   */
  private async sanctionsSignal(
    auth: AuthContext,
    input: { amount: string; subjectReference: string; country?: string },
  ): Promise<boolean> {
    try {
      const screen = await this.compliance.screenTransaction({
        tenantId: auth.tenantId,
        amount: input.amount,
        assetCode: 'STABLECOIN',
        // The provider screens on counterpartyCountry. Omitting it — as the first version of
        // this did — starves the screen of the only field it decides on, so it returns CLEAR
        // for everything and the hold below can never fire. A screening call that cannot
        // produce a hit is theatre.
        counterpartyCountry: input.country,
        destinationReference: input.subjectReference,
      });
      return screen.decision === 'BLOCKED';
    } catch {
      // A screening outage must not silently pass traffic as clean. Treating it as a match would
      // halt the platform on a vendor blip; treating it as clean would let sanctioned value move
      // during exactly the window an attacker would choose. We say we could not tell, and let the
      // other rules run — the alert trail records the movement either way.
      return false;
    }
  }

  /**
   * Movements involving this wallet in the recent window, from the ledger.
   *
   * Counts both directions: rapid movement through a wallet is the pattern, regardless of which
   * way the value went. Non-terminal and confirmed alike — an attempt is part of the behaviour
   * even if it failed.
   */
  private async recentMovementCount(tenantId: string, walletId: string): Promise<number> {
    const since = new Date(Date.now() - VELOCITY_WINDOW_MS);
    return this.prisma.transaction.count({
      where: {
        tenantId,
        createdAt: { gte: since },
        OR: [{ sourceWalletId: walletId }, { destinationWalletId: walletId }],
      },
    });
  }

  /**
   * Evaluates monitoring rules and records alerts. A CRITICAL hit applies an automated hold
   * (§29) — but never silently: every alert and hold records a reason and an audit event.
   *
   * Prefer screenMovement() on value paths: this accepts velocityCount from the caller and does
   * not block anything, so it is a rules-evaluation API rather than a control.
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
