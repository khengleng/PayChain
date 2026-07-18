# Trustee → PayChain Webhook Contract

This is the wire contract for the **outbound** direction of the trustee integration: the external
trustee platform delivers signed events, and PayChain receives them at a single endpoint. It is the
companion to [`trustee-integration-guide.md`](./trustee-integration-guide.md), which covers the
inbound (read-only verification) direction.

> Direction recap
> - **Inbound** (PayChain → trustee API): PayChain calls the trustee with trustee-issued credentials. Covered by the integration guide.
> - **Outbound** (trustee → PayChain): the trustee POSTs events here. This document.

## Endpoint

```
POST /api/v1/trustee/events
Content-Type: application/json
```

Base URL in production: `https://api.paychain.cambobia.com`
Full URL: `https://api.paychain.cambobia.com/api/v1/trustee/events`

There is **no bearer token** on this endpoint. The sender is a machine with no PayChain tenant
session; authenticity comes entirely from the HMAC signature below. Do not send an `Authorization`
header — it is ignored.

## Headers

| Header | Required | Description |
| --- | --- | --- |
| `Content-Type` | yes | Must be `application/json`. The raw body bytes are what get signed. |
| `X-Trustee-Signature` | yes | `sha256=<hex>` — see signing scheme below. |
| `X-Trustee-Timestamp` | yes | Unix time in **milliseconds** when the delivery was signed. |
| `X-Trustee-Delivery` | yes | Unique delivery id (UUID). Used as the idempotency / dedup key. |
| `X-Trustee-Event` | recommended | The event type (e.g. `trustee.attestation.published`). If omitted, PayChain reads `type` from the JSON body. |

## Signing scheme

Identical to the PayChain outbound scheme (`@paychain/security` §35), so the same verifier works in
both directions:

```
signed_payload = "<X-Trustee-Timestamp>" + "." + <raw request body>
signature      = "sha256=" + HMAC_SHA256(secret, signed_payload)   // hex
```

- `secret` is the shared webhook secret shown **once** at endpoint create/rotate on the trustee side.
  On PayChain it is supplied as the `TRUSTEE_WEBHOOK_SECRET` environment variable.
- The timestamp is part of the signed material, so it cannot be altered without breaking the signature.
- The signature is compared in constant time.

### Replay protection

PayChain rejects a delivery whose `X-Trustee-Timestamp` is more than **5 minutes** from server time
(past or future). Retries must re-sign with a current timestamp — reusing an old signature will be
rejected as stale. (The trustee's delivery worker already re-signs on each attempt.)

## Idempotency

`X-Trustee-Delivery` is the dedup key. PayChain processes each delivery id **exactly once**:

- First delivery of an id → processed, recorded, `200`.
- Retry / replayed dead-letter with the **same id and same body** → the stored `200` ack, not re-processed.
- Same id with a **different body** → `409 Conflict` (a tamper or sender-bug signal).

This makes the trustee's **"Replay all dead-lettered"** backlog flush safe: replaying deliveries
that actually arrived the first time is a no-op, and genuinely missed ones are processed once.

## Responses

| Status | Meaning | Sender action |
| --- | --- | --- |
| `200 OK` | Received (or already received — idempotent). Body: `{ "received": true, "deliveryId": "...", "eventType": "..." }` | Mark delivered. |
| `400 Bad Request` | Missing body, missing signature headers, or non-JSON body. | Fix the request; do not retry unchanged. |
| `401 Unauthorized` | Bad signature or stale/future timestamp (outside the 5-minute window). | Re-sign with the correct secret and a current timestamp, then retry. |
| `409 Conflict` | Delivery id reused with a different body. | Investigate; do not blind-retry. |
| `503 Service Unavailable` | `TRUSTEE_WEBHOOK_SECRET` is not configured on PayChain yet. | Retry later; this clears once PayChain sets the secret. |

Any non-`2xx` is treated by the trustee delivery worker as a failed attempt and retried with
backoff, then dead-lettered after the max attempts — where **Replay all dead-lettered** can re-drive it.

## Request example

```
POST /api/v1/trustee/events HTTP/1.1
Host: api.paychain.cambobia.com
Content-Type: application/json
X-Trustee-Event: trustee.attestation.published
X-Trustee-Delivery: 5f4d1c9a-7f0e-4a1b-9c2d-1e2f3a4b5c6d
X-Trustee-Timestamp: 1752969600000
X-Trustee-Signature: sha256=9b1f...c3a2

{"type":"trustee.attestation.published","stablecoinId":"sc_123","attestationId":"att_789"}
```

## Payload shape

PayChain treats the JSON body as an opaque, signed envelope and does not currently constrain its
fields beyond an optional top-level `type`. A minimal recommended envelope:

```json
{
  "type": "trustee.attestation.published",
  "id": "evt_...",
  "occurredAt": "2026-07-19T00:00:00.000Z",
  "data": { }
}
```

## What PayChain does on receipt

Today the receiver **verifies, dedups, and records** each event to the append-only audit trail
(action `trustee.event.received`) and acks `200`. Acting on specific event types (updating local
state, alerting) is a documented extension point in `TrusteeService.ingest` — add handling there
keyed on the event type without changing this wire contract.

## Notes on this contract

The header names (`X-Trustee-*`) and the shared-secret transport are defined **here** as PayChain's
published expectation; the receiver in `apps/api/src/trustee/` implements exactly this. If the
trustee platform already emits a different header set, reconcile against this document — the signing
scheme itself (HMAC-SHA256 over `timestamp.body`, `sha256=` prefix, 5-minute window) is fixed by
`@paychain/security` and must match on both sides.
