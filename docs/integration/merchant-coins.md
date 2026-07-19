# Merchant coins (unit value + PayKH provisioning)

A merchant's "loyalty points" are a reserve-backed stablecoin under the hood, with a peg currency
and a **unit value** — the two additions that make that work end-to-end.

## Unit value (denomination)
`StablecoinConfig.unitValue` = the value of **one coin** in `referenceCurrency`:
- `"1"` (default) — 1 coin = 1 currency unit (every existing coin; behaviour unchanged).
- `"0.01"` — 1 coin = $0.01 (USD).
- `"100"` — 1 coin = 100 KHR.

**Backing requirement (§23):** `reserve ≥ outstandingSupply × unitValue × reserveRatioTarget`, with the
reserve recorded in the **peg currency**. E.g. 1000 coins at unitValue `0.01`, target `1.0` ⇒ needs $10
of reserve. Computed exactly in fixed-point (`mulAmounts`); the mint/reserve gates use it automatically.

## Provisioning a merchant coin (PayKH)
`POST /api/v1/stablecoins/provision-merchant` — scope **`stablecoin.provision`** (in the
`MERCHANT_PLATFORM_SCOPES` preset), gated by `stablecoin.creation.enabled`. Body:
`{ assetCode, assetName, referenceCurrency (USD|KHR), unitValue, brandLabel, merchantReference, ... }`.
Creates a fiat-backed coin in **DRAFT**, attributed to the merchant, **branded** (e.g. "points"), under
the caller's tenant. It does **not** activate or mint — the existing lifecycle gates + trustee funding
still govern going live. "Un-brand to a real stablecoin" later = clear `brandLabel` + enable
redemption/transfer.

## Spending points on goods (customer point-of-sale)
When a customer spends points on goods at the merchant, the points are **burned** — supply drops, and
because the backing liability is `supply × unitValue`, the reserve that backed those points is no longer
owed and becomes the merchant's realized revenue. This is distinct from `POST .../redemptions` (a fiat
cash-out with KYC/compliance/bank payout); a spend has **no fiat leg**.

- `POST /api/v1/stablecoins/:id/spends` — scope **`stablecoin.spend`**, gated by `stablecoin.spend.enabled`,
  idempotency-keyed. Body: `{ walletId, amount, orderReference? }`. Requires the coin **ACTIVE**. At
  request time the customer wallet must be transactable and hold enough **non-escrowed** balance (the
  tokens are escrowed against double-spend the moment the spend is created).
- `POST /api/v1/spends/:spendId/advance` — drives the burn saga one step:
  `REQUESTED → BURN_PENDING → BURN_CONFIRMED → COMPLETED` (mirrors the redemption burn; atomic claim so a
  crash never double-burns). `GET /api/v1/spends/:spendId` reads state.
- **Supply accounting:** a spend reduces `outstandingSupply` only once its burn is **BURN_CONFIRMED**
  (`ReserveService.getState` subtracts confirmed spends alongside confirmed redemption burns). A submitted
  but unconfirmed burn does not shrink the liability early; a failed burn never does.
- **Releasing the freed reserve:** this flow does **not** move reserve money. Once supply drops the reserve
  is over-covered, and the merchant withdraws the freed amount through the existing **maker-checker reserve
  DEBIT** (`POST /reserve/movements` + a *different* principal's `/approve`) — every reserve outflow keeps
  its second-person approval.

## Cross-peg exchange (swap one coin for another)
A holder can swap one reserve-backed coin for another with a different peg/unit value (e.g. a KHR coin
`unitValue "100"` → a USD coin `unitValue "0.01"`). It is a **same-holder swap**: burn the source from the
wallet, mint the destination to the same wallet. Scope **`stablecoin.exchange`**, flag `stablecoin.exchange.enabled`.

- **Pricing:** `POST /api/v1/exchanges/quote` (idempotency-keyed). Body `{ fromAssetId, toAssetId, walletId,
  fromAmount, fxRate?, spread?, fee? }`. `fxRate` is the **source-currency → destination-currency** rate
  (default `"1"` for a same-currency rebasing). PayChain applies each coin's `unitValue`:
  `toAmount = fromAmount × unitValue_from × fxRate × (1 − spread) / unitValue_to − fee`. The rate is
  caller-supplied — a wrong rate mis-*prices* the swap but can never over-issue the destination, because the
  mint is reserve-gated (below).
- **Saga:** `POST /exchanges/:id/confirm` (checks the source is spendable + escrows it), then
  `POST /exchanges/:id/advance` drives `CONFIRMED → SOURCE_BURN_PENDING → SOURCE_BURNED → DEST_MINT_PENDING →
  COMPLETED`. If the mint leg fails after the burn, it enters `COMPENSATING` and re-issues the source so the
  holder is never left short. `GET /exchanges/:id` reads state.
- **Solvency:** the source burn reduces the **source** coin's supply (getState subtracts confirmed exchanges by
  `fromAssetId`), freeing its reserve. The destination mint calls the same `assertMintAllowed` gate as every
  mint — **it only succeeds if the destination coin is already funded** (its own fresh reserve covers the new
  supply). A CONFIRMED `StablecoinMintRequest` is written so the minted supply is visible.
- **No cross-currency reserve move:** the two coins keep separate, currency-incompatible reserves. The freed
  source reserve is converted/rebalanced into the destination's reserve **separately**, via the maker-checker
  reserve DEBIT + treasury record — never automatically inside the swap.
