import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Webhook signing scheme (§35). Signature = HMAC-SHA256(secret, `${timestamp}.${body}`).
 * The timestamp is signed to enable replay protection on the receiver side, and the
 * comparison is constant-time to avoid timing oracles.
 */
export interface WebhookSignatureHeaders {
  signature: string;
  timestamp: string;
}

export function signWebhook(secret: string, body: string, timestampMs: number): WebhookSignatureHeaders {
  const timestamp = String(timestampMs);
  const mac = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  return { signature: `sha256=${mac}`, timestamp };
}

export function verifyWebhook(
  secret: string,
  body: string,
  signatureHeader: string,
  timestamp: string,
  toleranceMs = 5 * 60 * 1000,
  nowMs?: number,
): boolean {
  const now = nowMs ?? Date.now();
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  // Replay protection: reject stale or far-future timestamps.
  if (Math.abs(now - ts) > toleranceMs) return false;

  const expected = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  const provided = signatureHeader.startsWith('sha256=')
    ? signatureHeader.slice('sha256='.length)
    : signatureHeader;
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(provided, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
