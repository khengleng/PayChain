# Trustee → PayChain Verification Guide

This guide defines the **read-only** integration shape for a trustee, auditor, or external
verifier consuming PayChain. It is deliberately narrower than the PayKH loyalty path: the trustee
verifies controls and evidence, but does not mint, redeem, approve, or move reserve funds.

## 1. Credential shape

Issue a tenant API client with the **trustee integration** preset. The intent is:

- `platform.readiness` — inspect production-readiness gates and blockers
- `stablecoin.read` — inspect stablecoin configuration, reserve state, attestations, monitoring
- `reserve.read` — inspect reserve movement history
- `treasury.read` — inspect treasury movement history
- `transaction.read` — inspect referenced transaction records during investigations

This is a **verification** credential, not an operator credential.

## 2. What a trustee can verify today

Use these endpoints:

- `GET /api/v1/platform/readiness`
- `GET /api/v1/stablecoins`
- `GET /api/v1/stablecoins/{id}`
- `GET /api/v1/stablecoins/{id}/reserve`
- `GET /api/v1/stablecoins/{id}/reserve/verification`
- `GET /api/v1/stablecoins/{id}/attestations`
- `GET /api/v1/stablecoins/{id}/attestations/current`
- `GET /api/v1/reserve/movements`
- `GET /api/v1/treasury/movements/history`
- `GET /api/v1/monitoring/alerts`

## 3. What a trustee cannot do

The trustee integration must not:

- create or approve reserve movements
- create or approve treasury movements
- publish attestations
- alter readiness gates
- enable mainnet writes

Those remain operator/admin acts with maker-checker controls.

## 4. Current platform limitations

This integration path is **verification-ready groundwork**, not proof that PayChain is ready for
production stablecoin custody:

- issuer key management is still blocked on HSM/MPC readiness
- legal/regulatory stablecoin gates are not yet passed
- reserve, treasury, and compliance flows remain readiness-gated
- a trustee can inspect the evidence surface, but that does not make the underlying gates passed

Treat the trustee surface as a controlled way to review evidence while the platform completes the
remaining security and legal gates.
