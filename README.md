# AI Coder Master Prompt — Build PayChain (Stablecoin-Ready)

You are a principal software architect, blockchain engineer, fintech engineer, security engineer, SRE, QA lead, compliance-aware product engineer, and senior full-stack developer.

Build a new production-grade platform named **PayChain**.

PayChain is a blockchain-backed digital value infrastructure platform built separately from the existing PayKH application.

Do not rename, overwrite, or replace PayKH. Do not modify PayKH during the initial PayChain build. PayKH will later consume PayChain through secure APIs and SDKs only after PayChain passes functional, security, resilience, reconciliation, operational, compliance, pilot, and migration-readiness gates.

PayChain must be:

- Loyalty-ready in Phase 1
- Stablecoin-ready from Phase 1
- Stablecoin-disabled by default in production
- Stellar-first
- Blockchain-provider-agnostic at the business layer
- Multi-tenant
- API-first
- SDK-ready
- Railway-deployable
- Designed for 10,000 to 1,000,000 transactions per day
- Designed for future use by PayKH, Biz Cambodia, banks, merchants, fintechs, government programs, and third-party applications

---

## 0. Precedence, Reconciliation, and Non-Negotiable Build Rules

Read this section before executing anything. Where any later section conflicts with §0,
**§0 governs**. These rules patch known failure modes and are not optional.

### 0.1 Execution model — do not run this as one job

The 21-step order in §48 is the *logical* order, not a single execution. This document is
a **program charter**. Build in **vertical milestones** as defined in
`docs/product/execution-plan.md` — one milestone per run, each a working, tested,
end-to-end slice before the next begins. Never stub a subsystem and report it as complete;
this violates §43 and §47.

### 0.2 Phase 1 scope — "readiness" is not "live"

§45 correctly places stablecoin *foundations* in Phase 1. To be explicit and authoritative:

* **Phase 1 INCLUDES (build now):** stablecoin data model, classification, lifecycle,
  feature flags (all production flags OFF), reserve/treasury/compliance *foundations*,
  mint/burn/redemption/conversion *code paths and API contracts*, proof-of-reserve and
  attestation *data models*, reconciliation categories, admin screens, tests, and docs.
* **Phase 1 EXCLUDES (do NOT run live):** public stablecoin issuance, real minting of
  value, live conversion, public cash redemption, cross-border transfer, DEX trading,
  algorithmic stablecoins, and any mainnet stablecoin write.
* "Readiness" means the code, schema, and controls exist and are exercised on **testnet
  and mocked providers only**, behind disabled flags. It never means real stable value is
  issued.

### 0.3 Single canonical asset enum

Use exactly one asset-type enum — the one in §13. Do not introduce a generic `STABLECOIN`
or `STABLE_VALUE` type, and do not implement `ALGORITHMIC_STABLECOIN` or asset-backed
tokens in the initial product (they may exist only as classification labels).

### 0.4 Additive-migration rule

All stablecoin fields (§14) and new tables must be introduced via **additive, reversible
migrations only**. Do not rewrite, drop, or recreate existing asset/wallet/transaction
tables. Never destroy financial data.

### 0.5 Cross-system consistency — mandatory saga/outbox pattern

Any operation spanning more than one system of record (chain + database, chain + bank,
chain + treasury, mint + reserve, redemption burn + fiat payout, loyalty→stablecoin
conversion) **must** use:

* A **transactional outbox** for all side effects (no fire-and-forget calls inside a DB
  transaction).
* An explicit **saga / state machine** with persisted state, so every step is resumable
  and every partial failure lands in a defined recoverable exception state — never a lost
  or double-applied write.
* **Idempotency keys** and **correlation IDs** threaded through every step.
* **Compensating actions** for anything already committed downstream.

Naive sequential multi-system calls are prohibited. This is the highest-risk area and is a
hard architectural gate.

### 0.6 Regulatory landmines — legal-review-gated, not config

* A **KHR-referenced** fiat-backed stablecoin (§14) implies National Bank of Cambodia
  licensing and may conflict with Bakong/CBDC policy. `KHR` may exist as a
  `reference_currency` value, but any KHR stablecoin asset must remain in `LEGAL_REVIEW`
  and cannot advance to `ACTIVE` without explicit legal sign-off recorded in the readiness
  scorecard.
* **Proof-of-reserve on-chain anchoring (§24) proves existence of a document hash, not
  sufficiency of reserves.** Documentation must not overstate it as cryptographic proof of
  solvency.
* The **issuer key** (§11) for any fiat-backed stablecoin must be HSM- or MPC-backed before
  that asset leaves `TECHNICAL_TESTING`. A dev-only encrypted key is acceptable for testnet
  readiness work but is a hard gate for any pilot.

### 0.7 Realistic performance-gate qualification (qualifies §40)

The 300 TPS sustained / 1,000 TPS burst targets are validated against the **mocked
blockchain provider** for pipeline throughput, **plus** a separate, honestly reported
measurement of real Stellar network latency and rate limits. Testnet ledger close is ~5s
and rate-limited; a true on-chain 1,000 TPS burst is not achievable on testnet and must not
be claimed as such. Report the two numbers separately. Never present a mock-only result as
real-network capability.

### 0.8 Redemption default sequencing (qualifies §25)

Burn and fiat payout are not atomic with an external bank. The **default** redemption model
is: reserve/escrow hold → payout authorization → burn on payout confirmation (or an
escrow-based hold where the provider supports it). Other sequencings may be configured, but
the default must be the safest one, and the risk of each configured model must be documented
in `docs/stablecoin/redemption-flow.md`.

---

## 1. Product definition

PayChain enables authorized applications, merchants, enterprises, banks, and fintech platforms to create wallets, create assets, issue loyalty points, transfer value, redeem and burn assets, freeze wallets, apply limits, sponsor Stellar reserves and fees, query balances and history, reconcile blockchain activity, configure campaigns, send signed webhooks, integrate through APIs and SDKs, and prepare controlled stablecoin issuance, redemption, reserve, treasury, compliance, and conversion workflows.

The initial business use case is loyalty points.

The platform must also be technically ready for cashback, promotional credits, merchant credits, gift cards, vouchers, coupons, membership credits, tickets, carbon credits, stable-value credits, fiat-backed stablecoins, and tokenized deposits.

Do not implement algorithmic stablecoins. Do not enable public stablecoin issuance, redemption, conversion, or transfer by default.

## 2. Strategic product boundary

```text
PayKH
Biz Cambodia
Merchant applications
Bank applications
ERP systems
Government applications
Third-party wallets
        |
        v
PayChain API and SDK
        |
        v
Stellar Network
```

PayChain is infrastructure. PayKH remains customer-facing. PayKH must become the first future client of PayChain, not the codebase converted into PayChain. Applications must never connect directly to Stellar.

## 3. Stablecoin-ready principle

PayChain must be technically ready for stable-value assets and fiat-backed stablecoins from Phase 1, but:

- Stablecoin production features are disabled by default.
- Mainnet activation requires explicit approval.
- Issuance requires reserve, compliance, treasury, legal, technical, and operational gates.
- Stablecoins use separate policies, workflows, permissions, limits, reconciliation, and monitoring.
- Loyalty-to-stablecoin conversion remains disabled until approved.
- Public stablecoin claims are prohibited until regulatory readiness is confirmed.

Implement feature flags for every stablecoin capability.

## 4. Technology stack

Backend:

- TypeScript
- NestJS
- REST API
- OpenAPI 3
- Prisma ORM
- PostgreSQL for operational data and rebuildable read models
- Redis for caching, locks, rate limiting, idempotency coordination, and queues
- BullMQ
- Stellar JavaScript SDK
- Stellar RPC
- Horizon only where required
- Structured JSON logging
- OpenTelemetry
- Prometheus-compatible metrics

Portals:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod
- Responsive design
- Khmer and English localization

Infrastructure:

- Railway
- Docker
- GitHub Actions
- Cloudflare
- S3-compatible storage
- Railway-managed PostgreSQL and Redis

Do not run a Stellar validator in the MVP. Use managed Stellar RPC/data providers and support provider failover.

## 5. Monorepo structure

```text
apps/
  api/
  worker/
  admin-portal/
  developer-portal/

packages/
  blockchain/
  stellar/
  database/
  auth/
  security/
  compliance/
  treasury/
  reserve/
  sdk-typescript/
  sdk-flutter-spec/
  validation/
  observability/
  config/
  testing/
  ui/

docs/
  architecture/
  api/
  blockchain/
  security/
  deployment/
  operations/
  product/
  testing/
  compliance/
  stablecoin/
  integration/
```

Use strict TypeScript. Avoid `any`.

## 6. Core modules

Create modules for identity, organizations, tenants, applications, API clients, wallets, Stellar accounts, assets, stablecoins, issuance, distribution, transfers, redemptions, burns, compensating transactions, sponsorship, fees, transactions, blockchain submission, confirmation, reconciliation, webhooks, idempotency, merchants, campaigns, loyalty rules, expiry, limits, fraud, compliance, treasury, reserve management, proof of reserve, attestations, conversions, notifications, audit logs, reporting, developer portal, administration, feature flags, system health, and provider management.

Do not allow direct cross-module database access.

## 7. Multi-tenancy

All tenant records must include `tenant_id`, `created_at`, `updated_at`, and `created_by` where applicable. Enforce tenant isolation in controllers, services, repositories, jobs, webhooks, logs, reports, and metrics. Never trust a tenant identifier supplied by a client. Add cross-tenant attack tests.

## 8. Roles and permissions

Platform roles:

- Super administrator
- Security administrator
- Operations administrator
- Compliance administrator
- Treasury administrator
- Support administrator
- Auditor

Tenant roles:

- Owner
- Administrator
- Developer
- Operations manager
- Finance operator
- Treasury operator
- Compliance operator
- Campaign manager
- Support operator
- Auditor
- Read-only analyst

Use explicit permissions such as `wallet:create`, `asset:issue`, `stablecoin:mint`, `stablecoin:redeem`, `reserve:manage`, `treasury:approve`, `compliance:review`, `transaction:compensate`, and `reconciliation:run`.

## 9. Blockchain provider abstraction

The business layer must not import Stellar SDKs.

```typescript
interface BlockchainProvider {
  createWallet(input: CreateWalletInput): Promise<CreateWalletResult>;
  createAsset(input: CreateAssetInput): Promise<CreateAssetResult>;
  establishTrustline(input: TrustlineInput): Promise<TrustlineResult>;
  issueAsset(input: IssueAssetInput): Promise<BlockchainTransactionResult>;
  transferAsset(input: TransferAssetInput): Promise<BlockchainTransactionResult>;
  redeemAsset(input: RedeemAssetInput): Promise<BlockchainTransactionResult>;
  burnAsset(input: BurnAssetInput): Promise<BlockchainTransactionResult>;
  freezeWallet(input: FreezeWalletInput): Promise<BlockchainTransactionResult>;
  unfreezeWallet(input: UnfreezeWalletInput): Promise<BlockchainTransactionResult>;
  getBalance(input: GetBalanceInput): Promise<AssetBalance[]>;
  getTransaction(input: GetTransactionInput): Promise<BlockchainTransaction>;
  getTransactionHistory(input: GetHistoryInput): Promise<BlockchainTransaction[]>;
  estimateFee(input: EstimateFeeInput): Promise<FeeEstimate>;
  healthCheck(): Promise<ProviderHealth>;
}
```

Only the Stellar package may use Stellar SDKs.

## 10. Stellar account strategy

Support one sponsored Stellar account per user wallet. Manage account creation, reserve sponsorship, trustline sponsorship, fee sponsorship, fee-bump transactions, sequence coordination, source-account partitioning, recovery, activation, suspension, closure where possible, and trustlines. Do not require customers to hold XLM.

## 11. Key management

Never store plaintext private keys. Create abstractions for local encrypted development keys, cloud KMS, HSM, and MPC. Support rotation, versioning, signing policies, dual approval, and emergency disablement.

Separate issuer, distribution, treasury, sponsorship, redemption, customer-wallet, and operational signing keys. Never use issuer keys for routine operations.

Require maker-checker for asset creation, stablecoin creation, large issuance, stablecoin minting, large burns, treasury transfers, reserve configuration changes, key rotation, mainnet activation, and emergency suspension.

## 12. Source-account partitioning

Do not submit all transactions from one Stellar source account. Partition by tenant, merchant, region, wallet shard, or transaction type. Create per-source queues. Prevent sequence collisions, serialize per source, retry temporary failures, detect expiry and duplicates, monitor depth, and support rebalancing and draining.

## 13. Generic asset model

Include:

- id
- tenant_id
- asset_code
- asset_name
- asset_type
- asset_classification
- issuer_account
- distribution_account
- treasury_account
- redemption_account
- network
- status
- decimals
- total_supply
- max_supply
- transferability
- redeemability
- expiry_policy
- clawback_enabled
- authorization_required
- authorization_revocable
- freeze_enabled
- merchant_scope
- metadata
- timestamps

Asset types:

```text
LOYALTY_POINT
CASHBACK
PROMOTIONAL_CREDIT
MERCHANT_CREDIT
GIFT_CARD
VOUCHER
COUPON
MEMBERSHIP_CREDIT
TICKET
CARBON_CREDIT
STABLE_VALUE_CREDIT
FIAT_BACKED_STABLECOIN
TOKENIZED_DEPOSIT
```

## 14. Stablecoin-specific model

Add:

- reference_currency
- reserve_model
- reserve_account_reference
- reserve_ratio
- redemption_enabled
- minting_model
- burning_model
- issuer_legal_entity
- regulated_status
- jurisdiction
- license_reference
- attestation_required
- attestation_frequency
- proof_of_reserve_enabled
- minimum_redemption_amount
- maximum_redemption_amount
- redemption_fee
- mint_fee
- transfer_fee
- daily_mint_limit
- daily_redeem_limit
- per_wallet_holding_limit
- travel_rule_required
- kyc_level_required
- aml_screening_required
- sanctions_screening_required
- feature_flag
- activation_status

Initial currencies: USD and KHR.

## 15. Stablecoin lifecycle

```text
DRAFT
LEGAL_REVIEW
COMPLIANCE_REVIEW
TREASURY_REVIEW
RESERVE_PENDING
TECHNICAL_TESTING
PILOT_APPROVED
ACTIVE
MINTING_SUSPENDED
REDEMPTION_SUSPENDED
FULLY_SUSPENDED
WIND_DOWN
CLOSED
```

Activation is blocked until mandatory approvals pass.

## 16. Wallet model

Include PayChain wallet ID, tenant, owner type, owner reference, Stellar account, status, verification, risk level, supported assets, limits, creation date, and last activity.

Owner types: Customer, Merchant, Organization, Treasury, Campaign, System, Redemption, Settlement.

The blockchain is authoritative for balances. Databases may only cache rebuildable read models.

## 17. Transaction model

Support wallet creation, trustline creation, asset creation, issue, transfer, redeem, burn, expiry, refund, compensation, fee sponsorship, reserve sponsorship, stablecoin mint request, mint, redemption request, stablecoin burn, fiat payout request, fiat payout confirmation, conversion quote, conversion execution, freeze, unfreeze, failure, and reconciliation.

Statuses include received, validating, compliance review, approval required, rejected, queued, signing, submitted, pending confirmation, confirmed, failed, expired, reversed by compensation, reconciliation required, and manual review.

Never delete financial transaction records.

## 18. Idempotency

Every write API must support tenant-scoped persistent idempotency. Same key and payload returns the original result. Same key and different payload returns conflict. Block duplicate webhooks, duplicate blockchain submission, duplicate fiat payout, and duplicate minting. Add concurrency tests.

## 19. Compensating transactions

Never rewrite confirmed blockchain history. Use compensating transactions for merchant error, refund, fraud, duplicate reward, campaign cancellation, dispute, manual correction, and expiry correction. Link every compensation to the original transaction and require approval over thresholds.

## 20. Loyalty engine

Phase 1 must support earn, redeem, optional transfer, expiry, merchant-funded rewards, platform-funded rewards, campaign bonuses, referral rewards, scratch-game rewards, purchase reversals, refund adjustments, manual corrections, wallet freeze, and merchant suspension.

Create a rules-engine interface. Do not hard-code campaign logic in controllers.

## 21. Expiry engine

Support fixed, rolling, none, campaign-specific expiry, oldest-earned-first redemption, and grace periods. The engine must identify eligible balances, create instructions, apply approvals, submit burn or clawback, track confirmation, notify users, audit, and reconcile.

## 22. Stablecoin mint and burn

Mint only when reserve/funding confirmation exists, compliance passes, limits pass, approvals pass, idempotency passes, signing policy passes, Stellar confirms, and reconciliation succeeds.

Never mint from an internal API request alone. Every mint and burn must reference funding, reserve, approval, compliance, treasury, blockchain hash, idempotency, correlation ID, and reconciliation status.

## 23. Reserve management

Support reserve account registration, bank and custodian references, reserve balances, reconciliation, reserve ratio, proof-of-reserve records, attestations, shortfall alerts, concentration alerts, suspension, movement approval, and reporting.

Do not store bank credentials. Support secure integration with banks, custodians, core banking, treasury, payment processors, and auditors.

Calculate outstanding supply, reserve balance, reserve ratio, unredeemed liability, pending mint liability, and pending redemption liability. Default reserve target for fiat-backed stablecoins is configurable and initially 100%. Do not mint on stale or unreconciled reserve data.

## 24. Proof of reserve

Support internal reserve reports, external attestations, signed documents, versioning, effective and expiry dates, public metadata, private evidence, reserve snapshot hashes, and optional on-chain anchoring. Never place confidential bank documents on-chain.

## 25. Stablecoin redemption

Support request, eligibility, KYC, AML, sanctions, wallet ownership, limits, fees, bank-account verification, approval, burn, fiat payout, confirmation, reconciliation, rejection, and failure handling.

Do not mark complete until both burn and fiat payout are confirmed.

## 26. Loyalty-to-stablecoin conversion

Build behind disabled feature flags. Require quote, quote expiry, rate, spread, fee, tenant policy, asset policy, KYC, jurisdiction, limits, liquidity, reserve availability, compliance, idempotency, approval, reconciliation, and compensation. Never implement as a database balance update.

## 27. Stablecoin wallet controls

Support balance limits, daily receive/send limits, monthly volume, transaction counts, allowed countries, wallet types, counterparties, KYC level, risk rating, sanctions status, EDD, transfer restrictions, freeze status, and redemption eligibility. Loyalty wallets do not automatically become stablecoin-enabled.

## 28. Compliance abstraction

```typescript
interface ComplianceProvider {
  screenCustomer(input: CustomerScreeningInput): Promise<ScreeningResult>;
  screenBusiness(input: BusinessScreeningInput): Promise<ScreeningResult>;
  screenTransaction(input: TransactionScreeningInput): Promise<ScreeningResult>;
  screenWallet(input: WalletScreeningInput): Promise<ScreeningResult>;
  createCase(input: CreateComplianceCaseInput): Promise<ComplianceCaseResult>;
  getCase(input: GetComplianceCaseInput): Promise<ComplianceCaseResult>;
}
```

Support KYC, KYB, AML, sanctions, PEP, adverse media, transaction monitoring, Travel Rule, fraud scoring, and case management without vendor lock-in.

## 29. Transaction monitoring

Detect structuring, rapid movement, circular transfers, risky counterparties/jurisdictions, volume spikes, dormant-wallet activation, shared identity patterns, unusual redemption, repeated failures, merchant collusion, referral abuse, and conversion abuse.

Severity levels: LOW, MEDIUM, HIGH, CRITICAL. Critical alerts may trigger holds or freezes. Audit every action.

## 30. Treasury module

Support minting liquidity, redemption liquidity, reserve monitoring, XLM fee balances, Stellar reserves, distribution balances, treasury balances, redemption balances, settlement balances, intraday liquidity, forecasting, shortfall alerts, and operational limits. Require maker-checker.

## 31. Reconciliation

Reconcile PayChain records, Stellar transactions, cached balances, expected supply, actual supply, treasury, distribution, redemption, sponsorship, pending mints, pending redemptions, bank reserves, custodian records, fiat payouts, and conversions.

Run near-real-time, hourly, daily, on-demand, and before/after major stablecoin batches.

Exceptions:

```text
SUPPLY_MISMATCH
RESERVE_SHORTFALL
MISSING_MINT
UNMATCHED_BURN
UNMATCHED_FIAT_PAYOUT
DUPLICATE_PAYOUT
ORPHAN_BLOCKCHAIN_TRANSACTION
STALE_RESERVE_DATA
UNAUTHORIZED_MINT
UNAUTHORIZED_TRANSFER
LIMIT_BREACH
```

Never conceal mismatches.

## 32. Read models

Use rebuildable read models for balances, history, merchant dashboards, campaign analytics, stablecoin dashboards, reserve dashboards, reports, search, and support.

Provide rebuild commands for wallet balances, transactions, asset supply, stablecoin supply, and reserve status.

## 33. API design

Base path: `/api/v1`.

Implement wallets, assets, transaction operations, stablecoins, mint requests, redemptions, conversions, reserve snapshots, attestations, webhooks, and health endpoints. All write APIs require idempotency.

## 34. API security

Support OAuth 2.0 client credentials, sandbox API keys, signed high-risk requests, JWTs, scopes, IP allowlisting, mTLS integration, rotation, and revocation. Never expose private keys.

## 35. Webhooks

Support wallet, asset, transaction, stablecoin, reserve, compliance, and conversion events. Require HMAC signatures, timestamps, replay protection, retry, dead-letter queue, delivery logs, manual replay, secret rotation, verification, and tenant isolation.

## 36. Feature flags

Create:

```text
stablecoin.module.enabled
stablecoin.creation.enabled
stablecoin.minting.enabled
stablecoin.redemption.enabled
stablecoin.transfer.enabled
stablecoin.conversion.enabled
stablecoin.mainnet.enabled
stablecoin.public-wallets.enabled
stablecoin.cross-border.enabled
stablecoin.travel-rule.enabled
```

Default all production stablecoin flags to disabled. Allow testnet flags independently.

## 37. Portals

Admin portal must support tenants, applications, API clients, wallets, assets, stablecoins, legal status, regulatory status, mint requests, redemptions, conversions, reserve, treasury, compliance alerts, reconciliation exceptions, providers, queues, fees, sponsorship budgets, supply, audit logs, feature flags, emergency controls, credentials, and webhooks.

Emergency controls include suspending minting, redemption, conversion, transfers, wallets, assets, tenants, applications, providers, and mainnet writes. Audit all actions.

Developer portal must support sandbox registration, credentials, docs, SDKs, webhook testing, usage, errors, examples, explorer, test wallets, test assets, and test stablecoins behind testnet flags.

## 38. SDKs

Create a TypeScript SDK with authentication, idempotency, retries, timeouts, correlation IDs, typed errors, webhook verification, wallet APIs, asset APIs, transaction APIs, testnet stablecoin APIs, and reserve reads.

Create a Flutter SDK specification. Do not require full Flutter implementation in Phase 1.

## 39. Railway deployment

Services:

```text
paychain-api
paychain-worker
paychain-admin
paychain-developer-portal
paychain-postgres
paychain-redis
```

Suggested domains:

```text
api.paychain.cambobia.com
admin.paychain.cambobia.com
developer.paychain.cambobia.com
```

Provide Dockerfiles, Railway config, commands, migrations, seeds, health checks, scaling guidance, rollback, backup, secret rotation, and environment documentation. Separate staging and production credentials.

## 40. Performance and resilience

Design for 10,000 to 1,000,000 transactions per day, around 12 TPS average at 1 million/day, 300 TPS sustained test, 1,000 TPS burst test, under 300 ms API acknowledgement for async blockchain processing, no duplicates, no sequence collisions, and no cross-tenant leakage.

Test the complete flow, not mocks only.

Support multiple API instances, worker scaling, distributed locks, retry, dead-letter queues, circuit breakers, provider failover, RPC timeout handling, graceful shutdown, queue draining, Redis/PostgreSQL restart, worker crash before/after submission, confirmation delay, duplicate webhook, timeout after successful submission, sequence conflict, KMS failure, reserve-provider failure, compliance-provider failure, and partial redemption failure.

## 41. Security and privacy

Implement OWASP API controls, validation, rate limiting, brute-force protection, secure headers, CSRF for portals, secure cookies, CSP, dependency scanning, secret scanning, container scanning, static analysis, audit logging, privileged approval, session revocation, and IP restrictions.

Never log keys, seeds, signing material, passwords, tokens, KYC documents, personal data, or bank credentials.

Never place names, phone numbers, emails, IDs, passports, addresses, invoices, purchase descriptions, KYC records, or behavioral data on-chain.

## 42. Testing

Create unit, integration, contract, end-to-end, Stellar testnet, load, security, reconciliation, failure-recovery, and stablecoin workflow tests.

Critical tests must cover wallet creation, sponsorship, trustlines, loyalty issuance, transfer, redemption, burn, expiry, compensation, freeze, idempotency, duplicate webhooks, sequence collision, provider failover, timeout after submission, reconciliation mismatch, cross-tenant attack, unauthorized scope, key rotation, worker restart, stablecoin creation, approval, mint request, reserve validation, rejection, duplicate mint, burn/redemption, duplicate payout prevention, quote expiry, compliance hold, wallet-limit breach, reserve shortfall, unauthorized mint, treasury approval separation, emergency suspension, feature flags, stablecoin supply reconciliation, and reserve reconciliation.

## 43. Production-readiness gates

Do not declare production-ready until these pass:

1. Functional integrity
2. Performance
3. Reliability
4. Security
5. Financial integrity
6. Loyalty pilot
7. Stablecoin legal/regulatory readiness
8. Stablecoin reserve readiness
9. Stablecoin treasury readiness
10. Stablecoin compliance readiness
11. Stablecoin technical readiness
12. Stablecoin pilot readiness
13. PayKH migration approval

Create evidence-based scorecards. Do not use arbitrary confidence percentages and do not confuse five-nines availability with confidence.

## 44. PayKH migration boundary

Do not change PayKH initially. Create only:

```text
docs/integration/paykh-integration-guide.md
packages/sdk-typescript/
examples/paykh-adapter/
```

Migration sequence:

1. Shadow integration
2. Read-only PayChain balance
3. Loyalty issuance dual-run
4. Loyalty redemption dual-run
5. Reconciliation comparison
6. Limited-user pilot
7. Merchant pilot
8. Gradual migration
9. Legacy wallet retirement only after approval

Stablecoin features in PayKH remain disabled until stablecoin gates pass.

## 45. Phase 1 scope

Build:

- Monorepo
- API and worker
- PostgreSQL and Redis
- Stellar provider abstraction and testnet provider
- Tenant and API-client management
- Wallet creation and sponsorship
- Trustlines
- Loyalty asset creation
- Issue, transfer, redeem, burn
- Expiry foundation
- Transaction tracking
- Idempotency
- Webhooks
- Reconciliation
- Audit logs
- Admin and developer portal foundations
- TypeScript SDK
- Railway deployment
- Automated tests
- Stablecoin asset model and lifecycle
- Stablecoin feature flags
- Reserve, treasury, and compliance foundations
- Mint request workflow
- Burn workflow
- Redemption workflow foundation
- Conversion interface
- Proof-of-reserve and attestation models
- Stablecoin reconciliation
- Stablecoin admin screens
- Stablecoin testnet API contracts and tests
- Stablecoin documentation

Do not enable public stablecoin issuance, public redemption, open conversion, cross-border stablecoin transfer, DEX trading, algorithmic stablecoins, or mainnet stablecoin production use.

## 46. Required documentation

Create product, architecture, blockchain, security, operations, deployment, integration, testing, compliance, and stablecoin documents, including:

```text
docs/operations/production-confidence-scorecard.md
docs/stablecoin/production-readiness-scorecard.md
docs/integration/paykh-integration-guide.md
docs/stablecoin/stablecoin-architecture.md
docs/stablecoin/reserve-management.md
docs/stablecoin/mint-and-burn.md
docs/stablecoin/redemption-flow.md
docs/stablecoin/conversion-flow.md
docs/stablecoin/proof-of-reserve.md
docs/stablecoin/treasury-controls.md
docs/stablecoin/compliance-controls.md
docs/stablecoin/transaction-monitoring.md
docs/stablecoin/reconciliation.md
docs/stablecoin/emergency-controls.md
```

## 47. Coding rules

- Inspect before editing.
- Make small, reviewable changes.
- Use strict typing.
- Validate all external input.
- Use domain-specific errors.
- Add migrations and tests.
- Document environment variables.
- Never log secrets.
- Never store plaintext private keys.
- Never bypass tenant or approval controls.
- Never mark placeholders production-ready.
- Never ignore reconciliation mismatches.
- Never assume blockchain submission means confirmation.
- Never retry financial operations without idempotency.
- Never enable stablecoin production features by default.
- Never mint without reserve confirmation.
- Never complete redemption without burn and fiat payout confirmation.
- Never let a read model become the hidden source of truth.

## 48. Execution order

1. Inspect repository.
2. Create architecture documents.
3. Create monorepo.
4. Create schemas and migrations.
5. Create blockchain provider interface.
6. Implement Stellar testnet provider.
7. Implement tenant/API authentication.
8. Implement wallet sponsorship.
9. Implement loyalty asset creation.
10. Implement issue, transfer, redeem, burn.
11. Implement idempotency and transaction states.
12. Implement confirmation listeners, webhooks, reconciliation, and audit logs.
13. Implement stablecoin models, lifecycle, and feature flags.
14. Implement reserve, treasury, and compliance abstractions.
15. Implement mint request, redemption foundation, and conversion interface.
16. Implement stablecoin reconciliation.
17. Implement SDK and portal foundations.
18. Add tests and Railway deployment.
19. Run lint, type checks, unit, integration, end-to-end, testnet tests, and production builds.
20. Fix all failures.
21. Produce a completion report.

The completion report must list completed features, files, endpoints, migrations, tests, results, security controls, stablecoin readiness controls, limitations, deferred work, dependencies, manual configuration, mainnet risks, stablecoin activation risks, and the recommended next phase.
