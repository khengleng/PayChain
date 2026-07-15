# PayKH → PayChain Integration Guide (Loyalty-Only)

This guide explains how the **existing PayKH app** integrates PayChain for loyalty. PayKH is
**not modified or converted** — it becomes PayChain's first client via the SDK (§2, §44). The
reference implementation is `examples/paykh-adapter/` (sample code, not the real PayKH).

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

## 4. Transaction status

```ts
const tx = await adapter.getTransactionStatus(transactionId); // { id, status, blockchainHash }
```

Submission is not confirmation (§40): a transaction may be `PENDING_CONFIRMATION` briefly. Read
the confirmed state, or subscribe to webhooks.

## 5. Webhook handling

Register a PayKH endpoint in the developer portal, then verify + dispatch:

```ts
const result = await handleWebhook(webhookSecret, rawBody, req.headers, {
  'asset.issued': async (p) => markRewardConfirmed(p.transactionId),
  'asset.redeemed': async (p) => markRedemptionConfirmed(p.transactionId),
});
```

Verification checks the HMAC signature + timestamp (replay protection). Treat delivery as
at-least-once; dedupe handlers on `deliveryId` / `transactionId`.

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
