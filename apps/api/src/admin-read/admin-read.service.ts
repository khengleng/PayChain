import { Injectable } from '@nestjs/common';
import type { Permission } from '../admin-auth/roles';
import { ReadinessService } from '../readiness/readiness.service';
import { PrismaService } from '../prisma/prisma.service';
import { tenantScopeWhere } from '../admin-auth/abac';
import { ReserveTieOutService } from '../stablecoin/reserve-tie-out.service';
import { STABLECOIN_FLAGS, GLOBAL_TENANT } from '../feature-flags/feature-flags.constants';

/** An admin's tenant scope: a list of tenant ids, or null for unscoped (all tenants). */
export type TenantScope = string[] | null;

/**
 * Cross-tenant, read-only admin views (§37). Every method here backs a permission-gated
 * admin-portal screen and reads across all tenants (the human admin is authorized by RBAC,
 * not by tenant scope). These are deliberately read-only: privileged writes (freeze, flag
 * toggle, treasury approval, …) already live in their own maker-checker-gated endpoints.
 *
 * All list methods cap results — an admin screen shows the most recent slice, never an
 * unbounded dump.
 */
const MAX = 200;

@Injectable()
export class AdminReadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readiness: ReadinessService,
    private readonly tieOut: ReserveTieOutService,
  ) {}

  /**
   * Three-way reserve tie-out per ACTIVE coin (§23/§31): internal ledger reserve ↔ on-chain
   * supply×unitValue ↔ trustee-attested fiat. This is the "does the money actually back the tokens,
   * and does the trustee agree" view — the gap PayKH named.
   */
  async reserveTieOuts(scope: TenantScope) {
    const configs = await this.prisma.stablecoinConfig.findMany({
      where: { ...tenantScopeWhere(scope), lifecycleState: 'ACTIVE' },
      take: MAX,
      select: { tenantId: true, assetId: true, asset: { select: { assetCode: true, assetName: true } } },
    });
    const items = [];
    for (const c of configs) {
      try {
        const t = await this.tieOut.tieOut(c.tenantId, c.assetId);
        items.push({ assetCode: c.asset.assetCode, assetName: c.asset.assetName, ...t });
      } catch {
        // A coin whose tie-out cannot be computed is skipped, never fails the whole list.
      }
    }
    return { items };
  }

  /** tenantId → tenant name, for enriching models that store only a tenantId string. */
  private async tenantNames(): Promise<Map<string, string>> {
    const tenants = await this.prisma.tenant.findMany({ select: { id: true, name: true } });
    return new Map(tenants.map((t) => [t.id, t.name]));
  }

  async wallets(scope: TenantScope, query?: string) {
    const q = query?.trim() || undefined;
    const where = {
      ...tenantScopeWhere(scope),
      ...(q
        ? {
            OR: [
              { ownerReference: { contains: q, mode: 'insensitive' as const } },
              { stellarAccountId: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const rows = await this.prisma.wallet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: MAX,
      include: { tenant: { select: { name: true } } },
    });
    return {
      query: q ?? null,
      items: rows.map((w) => ({
        id: w.id,
        tenant: w.tenant.name,
        ownerType: w.ownerType,
        ownerReference: w.ownerReference,
        stellarAccountId: w.stellarAccountId,
        status: w.status,
        verificationStatus: w.verificationStatus,
        riskLevel: w.riskLevel,
        createdAt: w.createdAt,
        lastActivityAt: w.lastActivityAt,
      })),
    };
  }

  async assets(scope: TenantScope) {
    const rows = await this.prisma.asset.findMany({
      where: tenantScopeWhere(scope),
      orderBy: { createdAt: 'desc' },
      take: MAX,
      include: { tenant: { select: { name: true } } },
    });
    return {
      items: rows.map((a) => ({
        id: a.id,
        tenant: a.tenant.name,
        assetCode: a.assetCode,
        assetName: a.assetName,
        assetType: a.assetType,
        status: a.status,
        transferability: a.transferability,
        redeemability: a.redeemability,
        expiryPolicy: a.expiryPolicy,
        createdAt: a.createdAt,
      })),
    };
  }

  async stablecoins(scope: TenantScope) {
    const rows = await this.prisma.stablecoinConfig.findMany({
      where: tenantScopeWhere(scope),
      orderBy: { createdAt: 'desc' },
      take: MAX,
      include: { asset: { select: { assetCode: true, assetName: true } } },
    });
    return {
      items: rows.map((s) => ({
        id: s.id,
        assetCode: s.asset.assetCode,
        assetName: s.asset.assetName,
        classification: s.classification,
        referenceCurrency: s.referenceCurrency,
        lifecycleState: s.lifecycleState,
        activationStatus: s.activationStatus,
        reserveRatioTarget: s.reserveRatioTarget,
        redemptionEnabled: s.redemptionEnabled,
        jurisdiction: s.jurisdiction,
        createdAt: s.createdAt,
      })),
    };
  }

  async reserve(scope: TenantScope) {
    const [accounts, tenants, trusteeSnaps] = await Promise.all([
      this.prisma.reserveAccount.findMany({ where: tenantScopeWhere(scope), orderBy: { createdAt: 'desc' }, take: MAX }),
      this.tenantNames(),
      this.prisma.reserveSnapshot.findMany({
        where: { ...tenantScopeWhere(scope), source: 'trustee' },
        orderBy: { takenAt: 'desc' },
        take: MAX,
      }),
    ]);
    // Newest trustee-attested figure per (tenant, asset), to show whether reserves are corroborated.
    const latestTrustee = new Map<string, { reserveBalance: string; takenAt: Date }>();
    for (const s of trusteeSnaps) {
      const key = `${s.tenantId}:${s.assetId}`;
      if (!latestTrustee.has(key)) latestTrustee.set(key, { reserveBalance: s.reserveBalance, takenAt: s.takenAt });
    }
    return {
      items: accounts.map((r) => {
        const t = latestTrustee.get(`${r.tenantId}:${r.assetId}`);
        return {
          id: r.id,
          tenant: tenants.get(r.tenantId) ?? r.tenantId,
          assetId: r.assetId,
          label: r.label,
          custodianReference: r.custodianReference,
          bankReference: r.bankReference,
          balance: r.balance,
          status: r.status,
          createdAt: r.createdAt,
          trusteeCorroborated: !!t,
          attestedBalance: t?.reserveBalance ?? null,
          attestedAt: t?.takenAt ?? null,
        };
      }),
    };
  }

  async trusteeActivity(scope: TenantScope) {
    const where = tenantScopeWhere(scope);
    const [authorizations, deposits, snapshots, tenants] = await Promise.all([
      this.prisma.trusteeMintAuthorization.findMany({ where, orderBy: { receivedAt: 'desc' }, take: MAX }),
      this.prisma.trusteeDeposit.findMany({ where, orderBy: { receivedAt: 'desc' }, take: MAX }),
      this.prisma.reserveSnapshot.findMany({ where: { ...where, source: 'trustee' }, orderBy: { takenAt: 'desc' }, take: MAX }),
      this.tenantNames(),
    ]);
    return {
      authorizations: authorizations.map((a) => ({
        id: a.id,
        tenant: tenants.get(a.tenantId) ?? a.tenantId,
        assetId: a.assetId,
        amount: a.amount,
        reference: a.reference,
        authorizationId: a.authorizationId,
        status: a.status,
        expiresAt: a.expiresAt,
        receivedAt: a.receivedAt,
      })),
      deposits: deposits.map((d) => ({
        id: d.id,
        tenant: tenants.get(d.tenantId) ?? d.tenantId,
        depositId: d.depositId,
        reference: d.reference,
        amount: d.amount,
        currency: d.currency,
        status: d.status,
        receivedAt: d.receivedAt,
      })),
      reserveSnapshots: snapshots.map((s) => ({
        id: s.id,
        tenant: tenants.get(s.tenantId) ?? s.tenantId,
        assetId: s.assetId,
        reserveBalance: s.reserveBalance,
        trusteeSnapshotId: s.trusteeSnapshotId,
        takenAt: s.takenAt,
      })),
    };
  }

  async treasury(scope: TenantScope) {
    const [movements, tenants] = await Promise.all([
      this.prisma.treasuryMovement.findMany({ where: tenantScopeWhere(scope), orderBy: { createdAt: 'desc' }, take: MAX }),
      this.tenantNames(),
    ]);
    return {
      items: movements.map((m) => ({
        id: m.id,
        tenant: tenants.get(m.tenantId) ?? m.tenantId,
        fromAccount: m.fromAccount,
        toAccount: m.toAccount,
        amount: m.amount,
        purpose: m.purpose,
        status: m.status,
        createdBy: m.createdBy,
        approvedBy: m.approvedBy,
        executedAt: m.executedAt,
        createdAt: m.createdAt,
      })),
    };
  }

  async complianceAlerts(scope: TenantScope) {
    const [alerts, tenants] = await Promise.all([
      this.prisma.monitoringAlert.findMany({ where: tenantScopeWhere(scope), orderBy: { createdAt: 'desc' }, take: MAX }),
      this.tenantNames(),
    ]);
    return {
      items: alerts.map((a) => ({
        id: a.id,
        tenant: tenants.get(a.tenantId) ?? a.tenantId,
        ruleKey: a.ruleKey,
        severity: a.severity,
        status: a.status,
        subjectType: a.subjectType,
        subjectReference: a.subjectReference,
        reason: a.reason,
        holdApplied: a.holdApplied,
        createdAt: a.createdAt,
        resolvedAt: a.resolvedAt,
      })),
    };
  }

  async reconciliation(scope: TenantScope) {
    const [exceptions, tenants] = await Promise.all([
      this.prisma.reconciliationException.findMany({ where: tenantScopeWhere(scope), orderBy: { createdAt: 'desc' }, take: MAX }),
      this.tenantNames(),
    ]);
    return {
      items: exceptions.map((e) => ({
        id: e.id,
        tenant: tenants.get(e.tenantId) ?? e.tenantId,
        category: e.category,
        status: e.status,
        transactionId: e.transactionId,
        blockchainHash: e.blockchainHash,
        correlationId: e.correlationId,
        createdAt: e.createdAt,
        resolvedAt: e.resolvedAt,
        resolvedBy: e.resolvedBy,
      })),
    };
  }

  async webhookFailures(scope: TenantScope) {
    const [deliveries, tenants] = await Promise.all([
      this.prisma.webhookDelivery.findMany({
        where: {
          ...(scope ? { tenantId: { in: scope } } : {}),
          status: { in: ['FAILED', 'DEAD'] },
        },
        orderBy: { createdAt: 'desc' },
        take: MAX,
        include: { endpoint: { select: { url: true, status: true } } },
      }),
      this.tenantNames(),
    ]);
    return {
      items: deliveries.map((d) => ({
        id: d.id,
        tenant: tenants.get(d.tenantId) ?? d.tenantId,
        endpointUrl: d.endpoint.url,
        endpointStatus: d.endpoint.status,
        eventType: d.eventType,
        eventId: d.eventId,
        status: d.status,
        attempts: d.attempts,
        lastError: d.lastError,
        correlationId: d.correlationId,
        createdAt: d.createdAt,
        deliveredAt: d.deliveredAt,
      })),
    };
  }

  async outboxFailures(scope: TenantScope) {
    const rows = await this.prisma.outboxEvent.findMany({
      where: {
        ...(scope ? { tenantId: { in: scope } } : {}),
        status: { in: ['FAILED', 'PENDING', 'PROCESSING'] },
      },
      orderBy: { createdAt: 'asc' },
      take: MAX,
    });
    return {
      items: rows.map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        aggregateType: row.aggregateType,
        aggregateId: row.aggregateId,
        eventType: row.eventType,
        status: row.status,
        attempts: row.attempts,
        correlationId: row.correlationId,
        createdAt: row.createdAt,
        processedAt: row.processedAt,
      })),
    };
  }

  /**
   * Feature flags for the GLOBAL scope, plus any tenant overrides. Every declared
   * stablecoin.* flag is shown even without a DB row — its effective value is then OFF,
   * making the "all production flags default OFF" invariant visible (§36).
   */
  async flags(scope: TenantScope) {
    const [rows, tenants] = await Promise.all([
      // GLOBAL flags are platform-wide and always visible; only tenant OVERRIDES are scoped,
      // since a global flag is not another tenant's data.
      this.prisma.featureFlag.findMany({
        where: scope ? { OR: [{ tenantId: GLOBAL_TENANT }, { tenantId: { in: scope } }] } : {},
        orderBy: [{ key: 'asc' }, { tenantId: 'asc' }],
      }),
      this.tenantNames(),
    ]);
    const globalByKey = new Map(
      rows.filter((r) => r.tenantId === GLOBAL_TENANT).map((r) => [r.key, r]),
    );
    const global: Array<{
      key: string;
      enabled: boolean;
      seeded: boolean;
      updatedBy: string | null;
      updatedAt: Date | null;
    }> = STABLECOIN_FLAGS.map((key) => {
      const row = globalByKey.get(key);
      return {
        key,
        enabled: row?.enabled ?? false,
        seeded: !!row,
        updatedBy: row?.updatedBy ?? null,
        updatedAt: row?.updatedAt ?? null,
      };
    });
    // Surface any non-declared global flags that exist in the DB too.
    for (const row of rows) {
      if (row.tenantId === GLOBAL_TENANT && !STABLECOIN_FLAGS.includes(row.key as never)) {
        global.push({ key: row.key, enabled: row.enabled, seeded: true, updatedBy: row.updatedBy, updatedAt: row.updatedAt });
      }
    }
    const overrides = rows
      .filter((r) => r.tenantId !== GLOBAL_TENANT)
      .map((r) => ({
        tenantId: r.tenantId,
        tenant: tenants.get(r.tenantId) ?? r.tenantId,
        key: r.key,
        enabled: r.enabled,
        updatedBy: r.updatedBy,
        updatedAt: r.updatedAt,
      }));
    return { global, overrides };
  }

  /**
   * Top-level admin portal summary, used by the overview dashboard.
   *
   * The first version of the dashboard was effectively a mockup with live health checks stapled
   * onto it: labels and links were static, and the operator learned nothing about platform state
   * until drilling into each page. This endpoint turns the overview into a real control surface by
   * feeding it the same counts and readiness state the underlying screens are built on.
   *
   * Counts are only returned for sections the caller may read. The dashboard must not leak the
   * existence or scale of another admin surface to a user who lacks that permission.
   */
  async overview(scope: TenantScope, permissions: Permission[]) {
    const scoped = tenantScopeWhere(scope);
    const can = (perm: Permission) => permissions.includes(perm);

    const counts = {
      tenants: null as number | null,
      wallets: null as number | null,
      assets: null as number | null,
      stablecoins: null as number | null,
      reserveAccounts: null as number | null,
      treasuryPending: null as number | null,
      complianceOpen: null as number | null,
      reconciliationOpen: null as number | null,
      flagOverrides: null as number | null,
      recentAuditEvents: null as number | null,
    };

    const jobs: Array<Promise<void>> = [];

    if (can('tenant:read')) {
      jobs.push(
        this.prisma.tenant
          .count({ where: scope ? { id: { in: scope } } : {} })
          .then((n) => void (counts.tenants = n)),
      );
    }
    if (can('wallet:read')) {
      jobs.push(this.prisma.wallet.count({ where: scoped }).then((n) => void (counts.wallets = n)));
    }
    if (can('asset:read')) {
      jobs.push(this.prisma.asset.count({ where: scoped }).then((n) => void (counts.assets = n)));
    }
    if (can('stablecoin:read')) {
      jobs.push(this.prisma.stablecoinConfig.count({ where: scoped }).then((n) => void (counts.stablecoins = n)));
    }
    if (can('reserve:read')) {
      jobs.push(this.prisma.reserveAccount.count({ where: scoped }).then((n) => void (counts.reserveAccounts = n)));
    }
    if (can('treasury:read')) {
      jobs.push(
        this.prisma.treasuryMovement
          .count({ where: { ...scoped, status: 'PENDING_APPROVAL' } })
          .then((n) => void (counts.treasuryPending = n)),
      );
    }
    if (can('compliance:read')) {
      jobs.push(
        this.prisma.monitoringAlert
          .count({ where: { ...scoped, status: { in: ['OPEN', 'HELD'] } } })
          .then((n) => void (counts.complianceOpen = n)),
      );
    }
    if (can('reconciliation:read')) {
      jobs.push(
        this.prisma.reconciliationException
          .count({ where: { ...scoped, status: 'OPEN' } })
          .then((n) => void (counts.reconciliationOpen = n)),
      );
    }
    if (can('flags:read')) {
      jobs.push(
        this.prisma.featureFlag
          .count({ where: scope ? { tenantId: { in: scope } } : { tenantId: { not: GLOBAL_TENANT } } })
          .then((n) => void (counts.flagOverrides = n)),
      );
    }
    if (can('audit:read')) {
      jobs.push(this.prisma.auditLog.count({ where: scoped }).then((n) => void (counts.recentAuditEvents = n)));
    }

    await Promise.all(jobs);
    const readiness = can('readiness:read') ? await this.readiness.summary() : null;

    return {
      readiness: readiness
        ? {
            productionReady: readiness.productionReady,
            mandatoryPassed: readiness.mandatoryPassed,
            mandatoryTotal: readiness.mandatoryTotal,
            blockedBy: readiness.blockedBy,
          }
        : null,
      counts,
    };
  }

}
