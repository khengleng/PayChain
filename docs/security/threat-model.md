# PayChain Threat Model (M5)

Scope: PayChain platform (API, worker, portals) on Stellar testnet, loyalty live +
stablecoin control plane/workflows behind disabled flags. This is a living document; the
stablecoin production surface expands it before any mainnet activation (§43 gates).

## Assets to protect

- Signing keys (issuer, distribution, treasury, sponsorship, customer-wallet).
- Customer balances and financial transaction integrity (no double-spend, no supply drift).
- Tenant isolation (no cross-tenant data or value access).
- Reserve/treasury integrity for stablecoins (no unbacked mint).
- PII kept off-chain.

## Trust boundaries

```
API clients ──(OAuth2 + JWT + scopes)──▶ API ──▶ Postgres / Redis
                                          │
                                          ├─(provider abstraction + failover)─▶ Stellar RPC/Horizon
                                          └─(mock in M5)──▶ compliance / bank / custodian / payout
Worker ──▶ Postgres / Redis / Stellar (background sagas, confirmation, reconciliation)
```

## Threats and mitigations (STRIDE-informed)

| Threat | Vector | Mitigation | Status |
|---|---|---|---|
| Spoofing | Forged tenant id / token | OAuth2 client-credentials, signed JWT, tenant id only from token (§7, §34) | Implemented |
| Tampering | Replayed/forged webhook | HMAC + timestamp + replay window (§35) | Implemented |
| Repudiation | Disputed privileged action | Append-only audit log w/ correlation ids (§41) | Implemented |
| Info disclosure | Leaked provider/DB errors | Global exception filter → generic 500 (§41) | Implemented |
| Info disclosure | Secrets in logs/repo | Never-log rules; CI secret scan; encrypted keys at rest (§41) | Implemented |
| DoS | Request flooding / large bodies | Rate limiting + body-size limits + helmet (§41) | Implemented |
| Elevation | Missing scope / cross-tenant | Scope guard + tenant-scoped queries + isolation tests (§7, §8) | Implemented |
| Double-spend | Retried financial write | Enforced idempotency on writes; saga idempotent recovery (§18, §0.5) | Implemented |
| Unbacked mint | Mint without reserve | Mint saga blocks minting before reserve confirmation (§22) | Implemented |
| Separation of duties | Self-approval | Maker-checker on mint/treasury/compensation (§19, §30) | Implemented |
| Availability | RPC outage | Provider failover + circuit breaker + timeout (§40) | Implemented |
| Key compromise | Weak dev key mgmt | Dev-encrypted keys; KMS/HSM/MPC a hard gate before pilot (§0.6, §11) | **Gated (pending)** |
| Regulatory | KHR stablecoin | Pinned in LEGAL_REVIEW until legal sign-off (§0.6) | Implemented |

## Known gaps (tracked, not yet closed)

- **Key management**: production KMS/HSM/MPC not yet integrated — hard gate before any pilot.
- **Penetration test**: not yet performed (§43 gate 4).
- **Rate limiter store**: in-memory; multi-instance needs Redis-backed storage.
- **Full-stack load & chaos tests**: harness exists; run against staging with the running API.
- **Real compliance/bank/custodian/payout providers**: mock in M5.
