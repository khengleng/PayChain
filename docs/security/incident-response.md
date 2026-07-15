# PayChain Incident Response

Scope: security, financial-integrity, and availability incidents. A completed incident-response
drill is a §43 pilot gate (`stablecoin_pilot`). This runbook is the drill script.

## Severity

| Sev | Examples | Target response |
|---|---|---|
| SEV1 | Unbacked mint, supply drift, key compromise, funds at risk | Immediate |
| SEV2 | Failed reconciliation, provider outage, stuck saga backlog | < 1h |
| SEV3 | Degraded latency, elevated error rate, single job failing | < 4h |

## Roles

Incident Commander · Ops · Security · Compliance · Comms. One IC per incident.

## Emergency controls (§37)

All actions are audited (`emergency_control_events` + audit log) and require a reason. Via
`POST /api/v1/admin/emergency` with scope `platform.emergency`:

| Action | Effect |
|---|---|
| `SUSPEND_MINTING` / `SUSPEND_REDEMPTION` / `SUSPEND_CONVERSION` / `SUSPEND_TRANSFERS` | Turns the corresponding stablecoin flag OFF (global or per-tenant) |
| `FREEZE_WALLET` (`targetId`) | Sets wallet status FROZEN |
| `FREEZE_ASSET` (`targetId`) | Sets asset status SUSPENDED |
| `DISABLE_TENANT` (`targetId`) | Suspends a tenant |
| `DISABLE_MAINNET_WRITES` | Forces `stablecoin.mainnet.enabled` OFF |

Mainnet writes can only be **re-enabled** via `POST /api/v1/admin/mainnet/enable`, which is
blocked until every mandatory readiness gate passes (§0.2, §43).

## Runbook

1. **Detect** — alert (monitoring CRITICAL, reconciliation exception, health check) or report.
2. **Declare** — assign IC; open incident channel; set severity.
3. **Contain** — apply the narrowest emergency control that stops harm (suspend the affected
   flow, freeze the wallet/asset). Prefer suspend over broad disable.
4. **Assess** — pull audit trail + correlation ids; run reconciliation on demand (see
   reconciliation runbook); quantify exposure.
5. **Eradicate/Recover** — fix root cause; resume flows only after reconciliation is clean.
6. **Verify** — reconciliation shows zero unexplained difference; sagas drained.
7. **Post-incident** — timeline, root cause, corrective actions; update this runbook and the
   readiness scorecard.

## Drill (tabletop + live on testnet)

Scenario: **suspected unauthorized mint on testnet.**

1. Trigger `SUSPEND_MINTING` (reason: "drill — suspected unauthorized mint"). Verify the flag
   is OFF and a new mint request is refused.
2. Freeze the implicated wallet (`FREEZE_WALLET`). Verify status FROZEN.
3. Run reconciliation; confirm the exception queue reflects the mismatch (never auto-fixed).
4. Resolve: mark the reconciliation exception, re-enable minting via feature flag.
5. Record the drill result on the `stablecoin_pilot` readiness gate with evidence.
