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
