import { PayChainClient } from '@paychain/sdk';

/**
 * Inbound PayChain webhook handling for PayKH (§35, §44). Verifies the HMAC signature +
 * timestamp (replay protection) before trusting the payload, then dispatches. PayKH should
 * treat delivery as at-least-once and make handlers idempotent (dedupe on the event id).
 */
export interface PayChainWebhookHeaders {
  'x-paychain-signature'?: string;
  'x-paychain-timestamp'?: string;
  'x-paychain-event'?: string;
  'x-paychain-delivery'?: string;
}

export interface WebhookEvent {
  eventType: string;
  deliveryId?: string;
  payload: Record<string, unknown>;
}

export class WebhookVerificationError extends Error {}

export function verifyAndParseWebhook(
  secret: string,
  rawBody: string,
  headers: PayChainWebhookHeaders,
): WebhookEvent {
  const signature = headers['x-paychain-signature'];
  const timestamp = headers['x-paychain-timestamp'];
  if (!signature || !timestamp) {
    throw new WebhookVerificationError('Missing signature or timestamp header');
  }
  if (!PayChainClient.verifyWebhook(secret, rawBody, signature, timestamp)) {
    throw new WebhookVerificationError('Invalid signature or stale timestamp');
  }
  return {
    eventType: headers['x-paychain-event'] ?? 'unknown',
    deliveryId: headers['x-paychain-delivery'],
    payload: JSON.parse(rawBody) as Record<string, unknown>,
  };
}

export type WebhookDispatch = Partial<Record<string, (payload: Record<string, unknown>) => Promise<void> | void>>;

/**
 * Verifies then routes an event to a handler. Unknown events are ignored (forward-compatible).
 * Handlers must be idempotent — dedupe on deliveryId / payload.transactionId.
 */
export async function handleWebhook(
  secret: string,
  rawBody: string,
  headers: PayChainWebhookHeaders,
  dispatch: WebhookDispatch,
): Promise<{ handled: boolean; eventType: string }> {
  const event = verifyAndParseWebhook(secret, rawBody, headers);
  const handler = dispatch[event.eventType];
  if (handler) await handler(event.payload);
  return { handled: Boolean(handler), eventType: event.eventType };
}
