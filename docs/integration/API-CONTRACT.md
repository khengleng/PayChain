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

Full URL: `https://api.paychain.cambobia.com/api/v1/trustee/events`

There is **no bearer token** on this endpoint. The sender is a machine with no PayChain tenant
session; authenticity comes entirely from the Ed25519 signature below. Any `Authorization` header is
ignored.

## Authenticity: Ed25519 (asymmetric)

The trustee signs each delivery with an **Ed25519 private key** and publishes only the **public
key**, identified by a key id (currently `webhook-v1`). PayChain verifies with the public key and
can never mint a valid trustee signature — the correct property for an inbound receiver.

PayChain is configured with:
- `TRUSTEE_WEBHOOK_PUBLIC_KEY` — the PEM SubjectPublicKeyInfo public key.
- `TRUSTEE_WEBHOOK_KEY_ID` — the expected key id (default `webhook-v1`). Deliveries stamped with a
  different key id are rejected; this is the key-rotation hook.

Current `webhook-v1` public key:

```
-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA1+du5fZR6Ow/6ER7j68/HCXUCTItkD9SwqoT3f75pT0=
-----END PUBLIC KEY-----
```

## Headers

| Header | Required | Description |
| --- | --- | --- |
| `Content-Type` | yes | `application/json`. The raw body bytes are what get signed. |
| `X-Trustee-Signature` | yes | Ed25519 signature, base64 (hex also accepted). |
| `X-Trustee-Key-Id` | yes | Key id, e.g. `webhook-v1`. Must match `TRUSTEE_WEBHOOK_KEY_ID`. |
| `X-Trustee-Timestamp` | yes | Unix time in **milliseconds** when signed (replay protection). |
| `X-Trustee-Delivery` | yes | Unique delivery id (UUID). Idempotency / dedup key. |
| `X-Trustee-Event` | recommended | Event type (e.g. `trustee.attestation.published`). If omitted, PayChain reads `type` from the JSON body. |

## Signing scheme

```
signed_message = "<X-Trustee-Timestamp>" + "." + <raw request body>
signature      = base64( Ed25519_sign(private_key, signed_message) )
```

The timestamp is part of the signed material, so it cannot be altered without breaking the
signature. Verification is the Node one-shot Ed25519 check (`crypto.verify(null, msg, key, sig)`).

> ⚠️ **Format confirmation pending.** The signed-message construction (`timestamp.body`), the
> signature encoding (base64/hex), and the exact `X-Trustee-*` header names above are PayChain's
> assumed contract, pinned to conventional choices. They are validated against the **first real
> trustee delivery** before the backlog is flushed. If the trustee's actual scheme differs, this
> document and `apps/api/src/trustee/` are updated to match — the Ed25519 verification itself is
> fixed, only the framing of what-gets-signed and header names may adjust.

### Replay protection

PayChain rejects a delivery whose `X-Trustee-Timestamp` is more than **5 minutes** from server time
(past or future). Retries must re-sign with a current timestamp — reusing an old signature is
rejected as stale.

## Idempotency

`X-Trustee-Delivery` is the dedup key. PayChain processes each delivery id **exactly once**:

- First delivery of an id → processed, recorded, `200`.
- Retry / replayed dead-letter with the **same id and same body** → the stored `200` ack, not re-processed.
- Same id with a **different body** → `409 Conflict` (a tamper or sender-bug signal).

This makes the trustee's **"Replay all dead-lettered"** backlog flush safe: replaying deliveries
that already arrived is a no-op, and genuinely missed ones are processed once.

## Responses

| Status | Meaning | Sender action |
| --- | --- | --- |
| `200 OK` | Received (or already received — idempotent). Body: `{ "received": true, "deliveryId": "...", "eventType": "..." }` | Mark delivered. |
| `400 Bad Request` | Missing body, missing signature headers, or non-JSON body. | Fix the request; do not retry unchanged. |
| `401 Unauthorized` | Bad signature, unknown key id, or stale/future timestamp. | Re-sign with the correct key and a current timestamp; check the key id. |
| `409 Conflict` | Delivery id reused with a different body. | Investigate; do not blind-retry. |
| `503 Service Unavailable` | `TRUSTEE_WEBHOOK_PUBLIC_KEY` is not configured on PayChain yet. | Retry later; clears once PayChain sets the key. |

Any non-`2xx` is treated by the trustee delivery worker as a failed attempt and retried with
backoff, then dead-lettered after the max attempts — where **Replay all dead-lettered** can re-drive it.

## Request example

```
POST /api/v1/trustee/events HTTP/1.1
Host: api.paychain.cambobia.com
Content-Type: application/json
X-Trustee-Event: trustee.attestation.published
X-Trustee-Key-Id: webhook-v1
X-Trustee-Delivery: 5f4d1c9a-7f0e-4a1b-9c2d-1e2f3a4b5c6d
X-Trustee-Timestamp: 1752969600000
X-Trustee-Signature: 3q2+7w...==

{"type":"trustee.attestation.published","stablecoinId":"sc_123","attestationId":"att_789"}
```

## What PayChain does on receipt

The receiver **verifies, dedups, and records** each event to the append-only audit trail (action
`trustee.event.received`) and acks `200`. Acting on specific event types is a documented extension
point in `TrusteeService.ingest`, keyed on the event type, without changing this wire contract.
