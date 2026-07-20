# Testnet runbook — PayKH merchant coin issuance

End-to-end: a PayKH merchant issues a **reserve-backed stablecoin branded as loyalty points**, and
PayChain mints it to a customer wallet. Testnet only. Pairs with
[`scripts/testnet-merchant-coin-smoke.sh`](../../scripts/testnet-merchant-coin-smoke.sh).

## The model
The merchant's "loyalty point" **is** the reserve-backed stablecoin (branded, "un-brandable" later).
Every coin is minted reserve-gated. Awarding points to a customer = **minting to the customer's
wallet** (the script does this). *Note:* the `/assets` `transfer`/`earn` routes do **not** work for the
merchant coin — they require the underlying `Asset.status = ACTIVE`, but stablecoin activation only
flips `stablecoinConfig.lifecycleState`, leaving `Asset.status = DRAFT`, and the coin is provisioned
`transferability:false`. Those routes are for plain `LOYALTY_POINT` assets. For the stablecoin, the
award path is the reserve-gated mint.

## One-time admin prerequisites (do in the admin portal — MFA is browser-side)
1. **Create the tenant** for PayKH (Tenants → new).
2. **Enable the flags** for that tenant (Feature Flags): `stablecoin.module.enabled`,
   `stablecoin.creation.enabled`, `stablecoin.minting.enabled`. Leave
   `stablecoin.trustee_authorization.required` **OFF** (keeps the `FUND-` mock funding path).
3. **Issue two API clients** (Tenants → the tenant → Clients). Maker-checker requires two distinct
   principals; both hold sensitive scopes, so **each needs an `ownerEmail`**:
   - **MAKER** — `stablecoin.provision`, `stablecoin.manage`, `reserve.manage`, `wallet.write`,
     `stablecoin.read`, `reserve.read`, `wallet.read`
   - **CHECKER** — `stablecoin.approve`, `reserve.approve`, `stablecoin.read`, `reserve.read`

   Copy each `clientId` + `clientSecret` (the secret is shown once).

## Run it
```bash
BASE_URL=https://api.paychain.cambobia.com \
MAKER_ID=... MAKER_SECRET=... \
CHECKER_ID=... CHECKER_SECRET=... \
./scripts/testnet-merchant-coin-smoke.sh
```
It provisions the coin → drives DRAFT→ACTIVE (6 gates, maker advances / checker approves) → registers
+ funds + snapshots the reserve → creates a customer wallet → mints to it → prints the balance. Every
step logs its status so a failure is obvious.

## PayKH's config to link to PayChain
**Outbound (PayKH → PayChain):**
- Base URL `https://api.paychain.cambobia.com` (all routes under `/api/v1`).
- Client `id`/`secret` → `POST /oauth/token` (`grant_type=client_credentials`) → cache the Bearer
  `access_token` (respect `expires_in`), send it on every call.
- The granted **scopes** (above). Send a unique **`Idempotency-Key`** header on every write.
- Call **server-side**; if you must call from the browser, add `paykh.cambobia.com` to PayChain's
  `API_ALLOWED_ORIGINS` (not in the default CORS list).

**Inbound (PayChain → PayKH webhooks):** register a public HTTPS endpoint (`webhook.manage`),
subscribe to `asset.issued`/`transferred`/`burned`, verify each delivery's signature, dedup on event id.

## What's mocked on testnet (so issuance completes without the real externals)
- **Funding**: `fundingReference` must start with `FUND-` (the script sets it). With the trustee flag
  off, `TrusteeReserveFundingProvider` accepts that mock.
- **Compliance**: `MockComplianceProvider` returns CLEAR.
- **Signing**: `local-dev` signer signs on testnet (the external HSM is a mainnet gate).
- **Reserve**: self-asserted (operator-credited) until a trustee reserve feed / `BAKONG_API_*` is wired.

For real (mainnet) issuance you additionally need: the HSM/KMS signer, the trustee's signed
authorizations + deposit confirmations, a real fiat-payout provider for redemptions, and a real
compliance provider — see the integration notes.
