# PayKH → PayChain Integration Guide (Loyalty-Only)

This guide explains how the **existing PayKH app** integrates PayChain for loyalty. PayKH is
**not modified or converted** — it becomes PayChain's reference B2B client via the SDK (§2, §44),
and other partners should follow the same integration pattern. The reference implementation is
`examples/paykh-adapter/` (sample code, not the real PayKH).

> **Scope guardrail:** the first integration is **loyalty-only**. PayKH stablecoin capabilities
> are designed (`stablecoin-preview.ts`) but stay disabled until PayChain's stablecoin readiness
> gates pass AND PayKH enables its feature flag (§22, §44).

## 1. Authentication

PayChain uses OAuth2 client-credentials. PayKH holds a `clientId`/`clientSecret` (per environment)
and the SDK exchanges them for a short-lived JWT, caching + refreshing automatically.

```ts
const adapter = new PayKhPayChainAdapter({
  baseUrl: process.env.PAYCHAIN_URL,
  clientId: process.env.PAYCHAIN_CLIENT_ID,
  clientSecret: process.env.PAYCHAIN_CLIENT_SECRET,
  loyaltyAssetId: process.env.LOYALTY_ASSET_ID,   // the PayChain asset for PayKH points
  loyaltyAssetCode: 'PTS',
});
```

Never expose secrets to the client app or logs; keep them server-side (§41).

## 2. Wallet creation

Map each PayKH customer to a PayChain wallet, idempotently:

```ts
const wallet = await adapter.ensureCustomerWallet(customerId);
```

Idempotency key `paykh:wallet:{customerId}` guarantees one wallet per customer even under retries.

## 3. Asset issuance & reward distribution

| PayKH event | Adapter call | Idempotency key |
|---|---|---|
| Purchase reward (rules engine) | `awardPurchaseReward` | `paykh:earn:{eventId}` |
| Referral reward | `awardReferralReward` | `paykh:referral:{eventId}` |
| Scratch-game reward | `awardScratchGameReward` | `paykh:scratch:{playId}` |
| Redemption | `redeemPoints` | `paykh:redeem:{eventId}` |
| Gifting/transfer | `transferPoints` | `paykh:transfer:{eventId}` |

**Every** money-moving call carries a deterministic idempotency key derived from PayKH's own
event id, so at-least-once queues and network retries never double-award (§18).

For a real payment-completion path, PayKH should wrap the low-level earn call in a
payment-settled orchestrator:

```ts
const result = await rewards.handlePaymentSuccess({
  paymentId: payment.id,
  customerId: payment.customerId,
  spendAmount: payment.amountUsd,
  currency: 'USD',
  merchantId: payment.storeId,
});
```

The orchestrator writes its record **before** calling earn, so a request that times out leaves a
recoverable `REWARD_REQUESTED` row rather than a payment PayKH has lost sight of. It then folds in
whatever PayChain returned: `CONFIRMED` only if the earn response already carried a confirmed
transaction, otherwise `PENDING_CONFIRMATION` until a webhook or a status poll settles it. Do not
treat *submission* as settlement — but do trust a status that says `CONFIRMED`.

> **Two different earn endpoints.** `awardPurchaseReward` calls `POST /assets/{assetId}/earn`, the
> loyalty rules engine: PayKH passes the **purchase** (`spendAmount`/`currency`) and PayChain
> computes the points, issues them and records a Transaction. That is the path this guide describes.
> `POST /stablecoins/{assetId}/earn` is a different product — a reserve-backed mint of a
> **caller-computed** `amount` through the trustee/compliance saga. It mints on-chain directly, so
> it returns a mint request rather than a Transaction and emits no `asset.issued` webhook; track it
> by polling the mint request, not with the flow below.

## 4. Transaction status

```ts
const tx = await adapter.getTransactionStatus(transactionId); // { id, status, blockchainHash }
```

Submission is not confirmation (§40): a transaction may be `PENDING_CONFIRMATION` briefly. Read
the confirmed state, or subscribe to webhooks.

PayChain's statuses map onto three outcomes PayKH must handle differently — the orchestrator's
`classifyTransactionStatus` is the single place this mapping lives:

| PayChain status | Reward outcome |
|---|---|
| `CONFIRMED` | `CONFIRMED` — settled |
| `RECEIVED`, `VALIDATING`, `QUEUED`, `SIGNING`, `SUBMITTED`, `PENDING_CONFIRMATION`, `APPROVED` | `PENDING_CONFIRMATION` — keep polling |
| `APPROVAL_REQUIRED` | `PENDING_CONFIRMATION`, but it rests here until a human acts — alert on age |
| `REJECTED`, `FAILED`, `EXPIRED`, `REVERSED_BY_COMPENSATION` | `FAILED` — terminal; reverse the points on PayKH's side |
| `RECONCILIATION_REQUIRED` | `NEEDS_RECONCILIATION` — PayChain's ledger and the chain disagree; escalate |

Note `REVERSED_BY_COMPENSATION`: an award undone after the fact is terminal, not pending. Treating
it as in-flight is how a clawed-back reward stays live in the loyalty balance.

## 5. Webhook handling

Register a PayKH endpoint in the developer portal, then verify + dispatch:

```ts
const result = await handleWebhook(webhookSecret, rawBody, req.headers, {
  'asset.issued': async (p, meta) => {
    await rewards.buildWebhookDispatch()['asset.issued']?.(p, meta);
  },
  'asset.redeemed': async (p) => markRedemptionConfirmed(p.transactionId),
});
```

Verification checks the HMAC signature + timestamp (replay protection). Treat delivery as
at-least-once; dedupe handlers on `deliveryId` / `transactionId`.

The `asset.issued` payload is `{transactionId, type, status, assetId, amount, blockchainHash}` — it
carries no business reference or idempotency key, so `transactionId` is the only join back to a
PayKH payment. Two consequences worth designing for:

- **Store the transaction id** as soon as earn returns it; it is the only correlation you get.
- **The event is not a confirmation.** PayChain emits `asset.issued` when it records the
  transaction, with `status` either `CONFIRMED` or `PENDING_CONFIRMATION`. Classify the carried
  `status`; do not infer settlement from the event name.

If webhook delivery is delayed or missed — or an earn call never returned a transaction id —
reconcile by sweeping:

```ts
const sweep = await rewards.reconcilePendingRewards();
if (sweep.failed > 0 || sweep.needsReconciliation > 0) escalate(sweep);
```

The sweep polls transaction status for records that have a transaction id, and for those that do
not it **replays the earn under its original `paykh:earn:{paymentId}` key** — PayChain dedupes on
that key and returns the original award, so recovering a timed-out call cannot double-award.

## 6. Failure handling

- The SDK retries transient 5xx/429 with backoff; writes are safe because of idempotency keys.
- A `409` on a write means the same idempotency key was reused with a **different** payload —
  investigate, do not blindly retry.
- Adapter errors are wrapped as `PayKhIntegrationError` with the operation for triage.
- If PayChain is unavailable during dual-run, PayKH keeps serving from its legacy ledger and
  replays the PayChain side later (the idempotency keys make replay safe).

## 7. Migration strategy (§44)

Controlled, reversible steps — no big-bang cutover:

1. **Shadow** — PayKH calls PayChain in the background; legacy remains authoritative.
2. **Read-only balance** — surface PayChain balance read-only alongside legacy.
3. **Issuance dual-run** — write rewards to both ledgers.
4. **Redemption dual-run** — write redemptions to both ledgers.
5. **Reconciliation comparison** — `compareLedgers(legacy, paychain)` must be **clean**.
6. **Limited customer pilot** → **merchant pilot**.
7. **Gradual traffic migration**.
8. **Legacy retirement** — only after the `paykh_migration` readiness gate is approved.

## 8. Dual-run reconciliation

```ts
const result = compareLedgers(legacyEntries, paychainEntries);
if (!result.clean) escalate(result.mismatches); // MISSING_IN_*, VALUE_MISMATCH
```

Advance a migration step only when comparisons are clean over a sustained window
(see `docs/operations/reconciliation-runbook.md`).

## 9. Rollback strategy

- Each step is independently reversible: stop dual-writing to PayChain, revert to legacy as the
  source of truth. Because PayChain never deletes financial records (§16), a rollback leaves a
  complete audit trail and PayChain balances can be reconciled/compensated afterward.
- Emergency controls (§37) can suspend flows platform-side during an incident.
- The legacy wallet is **not** retired until migration is approved — rollback is always available
  until then.

## 10. Stablecoin (future, disabled)

`DisabledStablecoinFeatures` defines the future surface (display/convert/receive/transfer/redeem
balance, compliance status, wallet limits, redemption status) but every method refuses until
enabled. Keep it off for the loyalty-only launch (§22, §44).
