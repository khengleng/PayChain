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
