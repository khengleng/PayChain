# Stablecoin architecture

Status: **sandbox (Stellar testnet)**. Not approved for issuance of a KHR-denominated
instrument. See [production-readiness-scorecard.md](./production-readiness-scorecard.md) for
the gates that are open and why.

This document describes **what is built**, not what is planned. Where a control is absent or
simulated it is marked so in place, because a document that describes intended behaviour as
though it were current behaviour is the specific failure this platform's §47 rules forbid, and
it is the failure a regulator is most entitled to be angry about.

---

## 1. Where the money actually is

Three distinct things get called "the balance", and conflating them is how reserve systems
lie by accident:

| Thing | Where it lives | Authoritative? |
|---|---|---|
| Token supply | Stellar testnet | **Yes.** The chain is the record of what exists. |
| `BalanceReadModel` | Postgres | No. A cache. Rebuildable from chain. |
| Reserve balance | `ReserveSnapshot` in Postgres | **No — asserted, not proven.** See §4. |

`BalanceReadModel` is a read model and is never the source of truth (§47). It is rebuilt from
chain by `pnpm --filter @paychain/database rebuild:wallet-balances`, and reconciliation raises
`BALANCE_DRIFT` when it disagrees with the chain. Detection without remediation would only tell
you to panic, so the rebuild command exists and has been run against production.

## 2. Components

```
apps/api/src/stablecoin/
  stablecoin.service.ts   asset lifecycle
  mint.service.ts         issuance + the reserve gate that bounds it
  redemption.service.ts   §0.8 escrow → payout → burn
  reserve.service.ts      ratio arithmetic, snapshot freshness (§23)
  treasury.service.ts     maker-checker on reserve movement
  attestation.service.ts  proof-of-reserve metadata (§24)
  monitoring.service.ts   §29 screening on the value path
  conversion.service.ts   points → stable value
```

Supporting invariants live outside this directory because they guard more than stablecoins:
`wallets/escrow.service.ts` (§25 holds), `wallets/wallet-policy.service.ts` (§27 default-deny),
`outbox/outbox.service.ts` (§0.5), `common/money.ts` (fixed-point).

## 3. Money is never a float

All amounts are strings at rest and 7-decimal `BigInt` in arithmetic (`common/money.ts`:
`toScaled`, `addAmounts`, `subAmounts`, `compareAmounts`, `sumAmounts`). Reserve ratio
comparison is exact integer cross-multiplication:

```ts
reserveScaled * SCALE >= supplyScaled * targetScaled
```

There is a `displayRatio()` for humans. It is display-only and must never gate a decision.
This is not pedantry: float money entered this codebase twice during construction and was
removed both times, once from a reserve gate that would have silently mis-collateralised.

## 4. What "backed" currently means — read this before believing any ratio

The reserve figure is a **number PayChain was told**, not a number PayChain verified.

- `MockReserveFundingProvider` simulates funding. No bank connection exists.
- `MockFiatPayoutProvider` simulates payout. No money moves.
- `MockComplianceProvider` blocks a hardcoded country list (KP/IR/SY) and clears everything
  else. It is a deterministic stub, not a watchlist: it cannot identify a sanctioned *person*.

Everything downstream is real: the ratio arithmetic is exact, the mint gate genuinely refuses
to breach the target ratio, snapshots older than `RESERVE_MAX_STALENESS_HOURS` genuinely block
minting (§23), and attestations genuinely pin the snapshot they describe. But a correct
computation over an asserted input is an asserted output. **Until a bank connection replaces
`MockReserveFundingProvider`, "100% backed" means "100% of what we entered".**

### The verification path (§31 "bank reserves")

`ReserveVerificationService` checks the reserve ledger against what a bank reports, and
`GET /api/v1/stablecoins/:id/reserve/verification` exposes the result:

- `VERIFIED` — the bank's figure matches our books.
- `DRIFT` — they disagree. Reported, never smoothed over.
- `UNVERIFIABLE` — no bank reference, or the bank could not be reached. **Not** verified.
  Silence is a mismatch we could not measure, not agreement.

`verifiedTotal` deliberately counts unverified accounts as **zero**, not as their claimed
figure, because it answers "how much can we prove?".

The bank behind it is currently `SandboxBankBalanceProvider` (mock Bakong), backed by an
`SandboxBankAccount` table that is an *independent* store rather than a view over
`ReserveAccount` — a mock bank echoing our own books could never disagree with them, and the
check would be a tautology that looks green forever. `HttpBankBalanceProvider` is the shape the
real client takes; the swap is a provider binding.

So `VERIFIED` today means "our books agree with a sandbox bank's independent figure". It proves
the path, not the funds.

The Bakong account discussed for reserve backing is a phone-linked personal account. That is
not a reserve account regardless of its balance: reserve must be segregated and held in the
issuing entity's name.

## 5. Controls that hold, and why

- **Custodial custody makes application-level escrow a real lock.** PayChain holds
  `stellarSecretEnc`; every debit passes `WalletsService.requireSecret`. There is no path to
  move these tokens without PayChain signing, so PayChain declining to sign *is* the lock.
  This reasoning collapses the moment self-custody is introduced — escrow would then have to
  become an on-chain hold. See [redemption-flow.md](./redemption-flow.md).
- **Mint is bounded** by daily limit → snapshot freshness → target-ratio breach check, in that
  order, in `assertMintAllowed()`. Every issuance path shares that one guard; a second guard
  would eventually disagree with the first.
- **Audit is hash-chained** (`seq`/`prevHash`/`entryHash`, enforced by DB triggers). Append-only
  and tamper-evident: rewriting an entry breaks every subsequent hash.
- **Maker-checker** on treasury reserve movement. The proposer cannot approve.

## 6. Gates that are closed, deliberately

`packages/config` fails closed rather than warning:

- `STELLAR_NETWORK` accepts only `testnet` / `futurenet`. **Mainnet is not reachable by
  configuration.** Issuing a KHR-denominated token on mainnet is the licensed activity being
  applied for; the enum is the control, not a reminder.
- `KEY_MANAGEMENT_PROVIDER` accepts `local-dev` only at runtime — selecting `kms`/`hsm`/`mpc`
  is rejected because no such integration exists. Claiming HSM in config while signing with a
  dev key would be worse than the current honest state.

Signing keys are dev-grade. This is the hard gate under §0.6 and no code change closes it.

## 7. Known absences

Load targets in §40 (300 TPS sustained, <300ms p99) are **unmeasured** — the harness is
in-process and mock-backed, so any number it produced would be measuring itself. §12
partitioning is not built (serialization exists; sharding does not). Sagas do not yet write
`Transaction` rows, so mints are invisible to reconciliation (§17).

---

See also: [reserve-management.md](./reserve-management.md),
[proof-of-reserve.md](./proof-of-reserve.md),
[transaction-monitoring.md](./transaction-monitoring.md),
[production-readiness-scorecard.md](./production-readiness-scorecard.md).
