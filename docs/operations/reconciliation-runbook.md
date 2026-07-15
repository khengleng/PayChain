# PayChain Reconciliation Runbook

Reconciliation is the independent check that PayChain records match the authoritative chain
and (for stablecoins) the reserve. "Zero unexplained difference" is a §43 gate for both the
loyalty pilot and the stablecoin pilot.

## What runs

The worker runs reconciliation on a schedule (near-real-time / hourly), comparing transaction
records against on-chain state and opening exceptions — it **never** overwrites or conceals a
mismatch (§31, §47). Reserve state (reserve balance vs outstanding supply vs ratio) is computed
by `ReserveService` and snapshotted.

## Exception categories

Loyalty/core: `MISSING_CONFIRMATION`, `SUPPLY_MISMATCH`, `DUPLICATE_TRANSACTION`,
`ORPHAN_BLOCKCHAIN_TRANSACTION`, `BALANCE_DRIFT`, `UNAUTHORIZED_MOVEMENT`.

Stablecoin: `RESERVE_SHORTFALL`, `MISSING_MINT`, `UNMATCHED_BURN`, `UNMATCHED_FIAT_PAYOUT`,
`DUPLICATE_PAYOUT`, `STALE_RESERVE_DATA`, `UNAUTHORIZED_MINT`, `LIMIT_BREACH`.

## Zero-difference verification (pilot gate)

1. Freeze mutation (optional for a clean snapshot): suspend the flows under audit.
2. Trigger reconciliation on demand; wait for the run to complete.
3. Query open exceptions: there must be **zero unresolved critical exceptions**.
4. For stablecoins, take a reserve snapshot and confirm:
   - `reserveBalance >= outstandingSupply` (ratio ≥ target, default 100%).
   - Confirmed mints − confirmed burns/redemptions = outstanding supply.
   - Reserve data is fresh (not `STALE_RESERVE_DATA`).
5. Record the result on the relevant readiness gate (`loyalty_pilot` / `stablecoin_pilot` /
   `stablecoin_reserve`) with the snapshot id as evidence.

## Handling an exception

1. Do not auto-resolve. Inspect via correlation id and the audit trail.
2. Classify: chain-lag (transient) vs genuine discrepancy.
3. For genuine discrepancies affecting value, escalate to incident response (SEV1/SEV2) and
   apply emergency controls if funds are at risk.
4. Resolve with a recorded reason; never delete financial records — use compensating
   transactions (§16, §19) for corrections.

## Cadence

- Near-real-time + hourly (worker schedule).
- On demand before/after any pilot batch or emergency action.
- Full end-of-day reconciliation before advancing a pilot readiness gate.
