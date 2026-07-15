# PayChain Production-Confidence Scorecard

Evidence-based readiness per §35. Confidence is not an arbitrary number; each row cites
measurable evidence. Status: ✅ met · 🟡 partial/foundation · ⛔ blocked/pending.

**As of:** M5 (hardening & performance). Environment: Stellar **testnet**; loyalty live;
stablecoin behind disabled flags. Mainnet remains blocked (§0.2, §43).

> Honesty rule (§0.7): a mock-only number is never presented as real-network capability.

## Functional correctness

| Metric | Target | Actual | Evidence | Status |
|---|---|---|---|---|
| Unit test suite | Green | **82 passing** | `pnpm -r test` | ✅ |
| Loyalty vertical slice (testnet) | End-to-end pass | Pass (~67s) | e2e: token→asset→wallets→issue→transfer→earn→compensate | ✅ |
| Idempotency on writes | Enforced | Enforced + race test | idempotency.service.spec | ✅ |
| Cross-tenant isolation | Blocked | Test proves NotFound | wallets.service.spec | ✅ |

## Performance (§0.7 — mock vs real reported separately)

| Metric | Target | Actual | Evidence | Status |
|---|---|---|---|---|
| In-process pipeline throughput (mock provider) | ≥ 1,000 ops/s | **~2.85M ops/s** (sustained & burst, Node 18, local) | `scripts/loadtest.ts` | ✅ |
| **Real** on-chain throughput | n/a (network-bound) | Bounded by Stellar ledger close (~5s) + rate limits; ~1 op/4s observed in e2e | testnet e2e timings | 🟡 |
| API ack latency (async model) | < 300 ms | Not yet measured under load on staging | — | 🟡 |

**Interpretation:** PayChain's own code is *not* the bottleneck (mock ceiling ≫ targets).
Real 300/1,000 TPS **must** be validated against the async submission + confirmation pipeline
on staging with the running API; testnet cannot sustain 1,000 TPS on-chain and that is never
claimed here.

## Reliability

| Metric | Target | Actual | Evidence | Status |
|---|---|---|---|---|
| Provider failover | Fails over on outage | Yes | failover-provider.spec | ✅ |
| Circuit breaker | Opens on repeated failure | Yes | circuit-breaker.spec | ✅ |
| RPC timeout handling | Bounded waits | withTimeout wraps every provider op | failover wiring | ✅ |
| Worker restart | Resumes jobs | Railway restart policy + idempotent jobs | deploy config | 🟡 |
| Redis/Postgres recovery | Recovers | Managed services; not chaos-tested here | — | 🟡 |

## Security

| Metric | Target | Actual | Evidence | Status |
|---|---|---|---|---|
| Rate limiting | Enabled | 120 req/60s/IP | ThrottlerGuard | ✅ |
| Secure headers | Enabled | helmet | main.ts | ✅ |
| Error leakage | None | Generic 500, real error logged | AllExceptionsFilter | ✅ |
| Dependency scan | High+ fails | CI `pnpm audit --audit-level high` | .github/workflows/ci.yml | ✅ |
| Secret scan | No secrets in repo | CI secret-scan.sh (passing) | ci.yml | ✅ |
| Lint/SAST-lite | Clean | ESLint green | `pnpm lint` | ✅ |
| Penetration test | Completed | Not performed | — | ⛔ |
| Key management review | KMS/HSM/MPC | Dev-encrypted only | §0.6 gate | ⛔ (pre-pilot gate) |

## Financial integrity

| Metric | Target | Actual | Evidence | Status |
|---|---|---|---|---|
| No double-mint on failure | Guaranteed | Timeout-after-submit stays SUBMITTED, mints once | mint.service.spec | ✅ |
| Redemption both-legs-confirmed | Required | COMPLETED only after burn+payout | redemption.service.spec | ✅ |
| Conversion compensation | Required | Re-issues points on mint failure | conversion.service.spec | ✅ |
| Reserve shortfall detection | Detected | Ratio check flags shortfall | reserve.service.spec | ✅ |
| Reconciliation exceptions | Never concealed | Exception queue, no overwrite | reconciliation.service.spec | ✅ |

## Compliance readiness

| Metric | Target | Actual | Evidence | Status |
|---|---|---|---|---|
| Provider abstraction | Vendor-neutral | Interface + mock | @paychain/compliance | 🟡 (mock) |
| Monitoring + holds | Audited holds | CRITICAL → audited hold | monitoring.service.spec | ✅ |
| Stablecoin gates | Blocked until approvals | Lifecycle blocks activation | lifecycle.spec | ✅ |

## Overall

Loyalty on testnet: **high confidence** (functional, security, financial-integrity evidence
in place). Stablecoin: **control plane + workflows ready and tested on mock/testnet**, but
**not production-ready** — pen test, real KMS/HSM, real compliance/bank/payout integrations,
full-stack load/chaos tests, and §43 gates 7–12 remain. Mainnet stays blocked.
