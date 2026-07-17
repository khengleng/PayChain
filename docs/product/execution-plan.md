# PayChain Execution Plan

> **Purpose.** The PayChain master prompt in `README.md` is a program charter, not a
> single executable command. This document slices it into milestones that can be handed
> to an AI coder (or a human team) **one at a time**. Each milestone is a vertical slice:
> it produces a working, tested, end-to-end result and is gated before the next begins.
>
> **Precedence.** This plan operates under `README.md` §0 (Precedence, Reconciliation, and
> Non-Negotiable Build Rules). Where any section conflicts with §0, §0 governs. Section
> references below point to the consolidated master prompt (§1–§48).

---

## How to run this plan

- **One milestone per run.** Do not start a milestone until the previous milestone's exit
  gate passes.
- **Vertical, not horizontal.** Each milestone must run end-to-end (API → queue → signing
  → chain → confirmation → read model), not "all docs, then all schema, then all code."
- **No fake completions.** A stub is not a feature. If something is deferred, say so in the
  completion report. This is enforced by §43 and §47 of the master prompt.
- **Exit gate = evidence.** A milestone is "done" only when its listed gate checks pass
  with real, reported evidence (test output, reconciliation result, load numbers).

---

## Milestone map

| # | Milestone | Theme | Live value? |
|---|-----------|-------|-------------|
| M0 | Foundation + first vertical slice | Prove the spine works | Testnet only |
| M1 | Platform integrity | Idempotency, reconciliation, webhooks, audit | Testnet only |
| M2 | Loyalty product completeness | Rules, expiry, compensation, portals, SDK | Testnet only |
| M3 | Stablecoin readiness — data & control plane | Schema, lifecycle, flags (OFF), abstractions | None (readiness) |
| M4 | Stablecoin readiness — workflows | Mint/burn/redeem/convert code paths, reserve/treasury/compliance | Mock + testnet |
| M5 | Hardening & performance | Resilience, load, security review | Testnet only |
| M6 | Pilot gates | Testnet pilot → closed mainnet pilot | Gated mainnet |
| M7 | PayKH integration (loyalty-only) | Shadow → dual-run → migration | Gated |

---

## M0 — Foundation + first vertical slice

**Goal:** one loyalty point moves end-to-end on Stellar testnet through the full pipeline.

Build:
- Monorepo (pnpm workspaces), TypeScript strict mode, lint/format/CI skeleton (§4, §5).
- PostgreSQL + Redis via Docker; Prisma schema for tenant, wallet, asset, transaction
  (additive-migration discipline from day one — §0.4).
- `BlockchainProvider` interface + **Stellar testnet** implementation (only the stellar
  package imports the Stellar SDK — §9).
- Tenant + API-client auth (OAuth2 client credentials); tenant isolation in controllers,
  services, and repository queries (§7, §34).
- Vertical slice: **create wallet (sponsored account + trustline) → issue LOYALTY_POINT →
  transfer → read balance from read model** (§10, §13, §16).

Exit gate:
- The full slice runs against testnet with confirmation tracked (not assumed) (§0.5, §47).
- Cross-tenant access test passes (§7).
- Wallet-balance read model is rebuildable from chain (§32) — `pnpm --filter @paychain/database rebuild:wallet-balances`.
  This line previously claimed a rebuild command existed when none did. §32 also requires rebuilds
  for transactions, asset supply, stablecoin supply and reserve status: those are still MISSING.
- Lint + typecheck + tests green; completion report lists what is real vs. deferred (§48).

---

## M1 — Platform integrity

**Goal:** the spine is safe to build on.

Build:
- **Idempotency** on all write APIs (same key+payload → original result; key+different
  payload → conflict; tenant-scoped; survives restart) + concurrency tests (§18).
- **Source-account partitioning** with per-source queues and sequence-number safety (§12).
- **Confirmation listeners** and full transaction state machine (§17).
- **Reconciliation** (near-real-time / hourly / daily) with an exception queue that never
  auto-overwrites discrepancies (§31).
- **Webhooks** (HMAC, replay protection, retries, DLQ, manual replay) — non-blocking (§35).
- **Audit logging** with correlation IDs across API/queue/worker/chain/webhook (§41).

Exit gate:
- Idempotency + duplicate-webhook + sequence-collision tests pass (§42).
- A deliberately injected mismatch surfaces as a reconciliation exception (not silently
  fixed) (§31).
- Audit trail is queryable and complete for a full transaction lifecycle.

---

## M2 — Loyalty product completeness

**Goal:** Phase-1 loyalty use cases are genuinely usable.

Build:
- Rules-engine interface (no campaign logic hard-coded in controllers) — earn/redeem/
  bonus/referral/limits/eligibility (§20).
- Expiry engine (off-chain scheduler, approval-gated burns/clawbacks, audited) (§21).
- Compensating-transaction flow with reason codes and threshold approvals (§19).
- Admin portal foundation + developer portal foundation (§37).
- TypeScript SDK (auth, idempotency, retries, correlation IDs, webhook verification) (§38).
- Railway deployment files + environment documentation (§39).

Exit gate:
- Earn → redeem → expire → compensate all pass on testnet with audit + reconciliation.
- SDK drives the full loyalty flow.
- Deployable to a staging environment with health checks green.

---

## M3 — Stablecoin readiness: data & control plane

**Goal:** the platform can *represent and govern* stablecoins without issuing any value.
No live minting. All production flags OFF.

Build:
- Single canonical **asset-type enum** per §0.3 and §13 (no generic `STABLECOIN`/`STABLE_VALUE`).
- Stablecoin asset fields via **additive migrations** (§0.4, §14).
- **Stablecoin lifecycle** state machine with maker-checker gates (§15); KHR assets pinned
  in `LEGAL_REVIEW` per §0.6.
- **Feature flags** (§36) — all `stablecoin.*` production flags default disabled; testnet
  independently toggleable.
- **Compliance provider abstraction** (§28) — interface only, mock implementation.
- **Wallet-level stablecoin policy** model (§27) — wallets are not auto-eligible.
- Proof-of-reserve + attestation **data models** (§24) — no anchoring of live data.
- Stablecoin **reconciliation categories** (§31) wired into the M1 exception queue.
- Admin **screens** for stablecoin config, flags, and emergency controls (§37).

Exit gate:
- Cannot activate a stablecoin asset without all required approvals (test proves it) (§15).
- All production flags verified OFF by default (feature-flag enforcement test) (§36).
- Schema migrations are additive and reversible; existing loyalty flows unaffected (§0.4).

---

## M4 — Stablecoin readiness: workflows (mock + testnet)

**Goal:** mint/burn/redeem/convert code paths exist and are exercised on **mocked
providers and testnet only**, behind disabled flags, using the mandatory saga/outbox
pattern from §0.5.

Build:
- **Mint request workflow** with all preconditions (§22) — reserve confirm before mint,
  idempotent, approval-gated, reconciled.
- **Burn workflow** (redemption/cancellation/correction/wind-down) with full references (§22).
- **Redemption engine** with the default safe sequencing from §0.8 (§25).
- **Conversion service** (loyalty ↔ stablecoin) as quote → confirm → burn → mint saga with
  compensation — never a simple balance update (§26). Disabled by default.
- **Reserve module** (registration, balance, ratio, shortfall/concentration alerts,
  movement approval) — no stored bank credentials (§23).
- **Treasury module** with maker-checker and create≠approve separation (§30).
- **Transaction monitoring** rules + LOW/MED/HIGH/CRITICAL alerts with audited holds (§29).
- Stellar stablecoin controls: isolated issuer + separate distribution/treasury/redemption
  keys, auth-required/revocable/clawback where legal (§11, §13).
- Stablecoin API contracts (§33), all writes idempotent.
- Full stablecoin test suite (§42).

Exit gate:
- Every stablecoin readiness gate in §43 (gates 7–12) that is testable on testnet/mocks
  passes.
- Saga partial-failure tests: network timeout after mint submit, and partial redemption
  failure, both land in recoverable states with no double-spend (§0.5, §40).
- Treasury create-and-approve-by-same-user is rejected (§30).
- Supply and reserve reconciliation run with zero unexplained difference on test data (§31).

---

## M5 — Hardening & performance

**Goal:** honest reliability and performance evidence.

Build / run:
- Resilience tests (§40): RPC failover, Redis/Postgres restart, worker crash during
  signing and after submission, KMS unavailable, transaction expiration.
- Load tests (§40) under the **§0.7 qualification**: mock-provider pipeline throughput
  (target 300 sustained / 1,000 burst) reported *separately* from real testnet latency.
- Security controls (§41) + security review: SAST, dependency/secret/container scans,
  key-management review, threat model.

Exit gate:
- §43 gates 2, 3, 4 (Performance, Reliability, Security) pass with reported evidence.
- No mock-only number is presented as real-network capability (§0.7).
- `docs/operations/production-confidence-scorecard.md` populated with real measurements (§43).

---

## M6 — Pilot gates

**Goal:** move from "readiness" toward gated real use, one controlled step at a time.

- Testnet pilot completed; ≥1M cumulative test/pilot transactions; zero unresolved
  critical reconciliation issues (§43 gate 6).
- Stablecoin pilot gate (§43 gates 7–12): closed mainnet pilot **approved** (not opened),
  reserve + supply reconciled to zero unexplained difference, HSM/MPC issuer key in place
  (§0.6), incident-response drill completed.
- KHR assets remain blocked pending legal sign-off (§0.6, §43 gate 7).

Exit gate:
- Every mandatory gate in §43 passes. Production activation stays blocked until they do.

---

## M7 — PayKH integration (loyalty-only)

**Goal:** PayKH begins consuming PayChain for **loyalty only**. Stablecoin capabilities in
PayKH remain behind disabled flags (§44).

- Do not modify the real PayKH app during earlier milestones (§44). Build only the
  integration guide + sample adapter.
- Sequence: shadow → read-only balance → issuance dual-run → redemption dual-run →
  reconciliation comparison → limited customer pilot → merchant pilot → gradual migration
  → legacy retirement only after approval (§44).
- PayKH stablecoin features (display/convert/receive/transfer/redeem) stay OFF until
  PayChain stablecoin readiness gates pass (§44).

Exit gate:
- §43 gate 13 (PayKH migration approval) satisfied; first integration is loyalty-only.

---

## Cross-cutting rules (apply to every milestone)

- **Blockchain is authoritative**; the database is a rebuildable read model (§16, §32).
- **Never** log secrets, store plaintext keys, bypass tenant checks, bypass maker-checker,
  mark placeholders production-ready, silently ignore reconciliation mismatches, assume
  submission means confirmation, or retry a financial transaction without idempotency (§47).
- **Every multi-system operation uses the saga/outbox pattern** (§0.5).
- **Every milestone ends with a completion report** listing completed features, real vs.
  deferred, test results, and known limitations (§48).
