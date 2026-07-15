# PayKH Adapter (example)

Sample adapter showing how the **existing PayKH app** integrates PayChain for **loyalty only**
(§44). This is reference code — **not** the real PayKH app, which is never modified during the
PayChain build.

- `adapter.ts` — loyalty operations (wallet, purchase/referral/scratch rewards, redeem, transfer,
  balance) with deterministic idempotency keys.
- `webhook-handler.ts` — verify (HMAC + timestamp) and dispatch PayChain webhooks.
- `stablecoin-preview.ts` — the future stablecoin surface, **disabled** until readiness gates pass.
- `dual-run.ts` — shadow/dual-run ledger comparison for migration.
- `example.ts` — runnable end-to-end loyalty demo.

See `docs/integration/paykh-integration-guide.md` for the full guide (auth, ops, migration,
dual-run, rollback).

```bash
pnpm --filter @paychain/example-paykh-adapter test
LOYALTY_ASSET_ID=... pnpm --filter @paychain/example-paykh-adapter example
```
