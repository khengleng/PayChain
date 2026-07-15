import { SymmetricCrypto, signWebhook } from '@paychain/security';

export interface HttpResponse {
  status: number;
}
export type HttpPost = (
  url: string,
  body: string,
  headers: Record<string, string>,
) => Promise<HttpResponse>;

export interface DeliveryRecord {
  id: string;
  eventType: string;
  payload: unknown;
  attempts: number;
  endpoint: { url: string; secretEnc: string };
}

export interface WebhookDeliveryPrisma {
  webhookDelivery: {
    findMany(args: unknown): Promise<DeliveryRecord[]>;
    update(args: unknown): Promise<unknown>;
  };
}

export type DeliveryOutcome = 'DELIVERED' | 'FAILED' | 'DEAD';

/**
 * Delivers queued webhooks (§35): HMAC-signed body, retry accounting, and a dead-letter
 * terminal state after maxAttempts. Delivery is decoupled from request/chain processing,
 * so a slow or failing receiver never blocks the platform. Signing uses the shared scheme
 * so receivers can verify with the secret from endpoint create/rotate.
 */
export class WebhookDeliveryService {
  constructor(
    private readonly prisma: WebhookDeliveryPrisma,
    private readonly crypto: SymmetricCrypto,
    private readonly httpPost: HttpPost,
    private readonly maxAttempts = 6,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async processPending(limit = 50): Promise<{ scanned: number }> {
    const deliveries = await this.prisma.webhookDelivery.findMany({
      where: { status: { in: ['PENDING', 'FAILED'] } },
      take: limit,
      include: { endpoint: true },
    });
    for (const d of deliveries) await this.attempt(d);
    return { scanned: deliveries.length };
  }

  async attempt(d: DeliveryRecord): Promise<DeliveryOutcome> {
    const body = JSON.stringify(d.payload);
    const secret = this.crypto.decrypt(d.endpoint.secretEnc);
    const { signature, timestamp } = signWebhook(secret, body, this.now());
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-PayChain-Event': d.eventType,
      'X-PayChain-Delivery': d.id,
      'X-PayChain-Signature': signature,
      'X-PayChain-Timestamp': timestamp,
    };

    try {
      const res = await this.httpPost(d.endpoint.url, body, headers);
      if (res.status >= 200 && res.status < 300) {
        await this.prisma.webhookDelivery.update({
          where: { id: d.id },
          data: { status: 'DELIVERED', attempts: d.attempts + 1, deliveredAt: new Date(), lastError: null },
        });
        return 'DELIVERED';
      }
      return this.markFailure(d, `HTTP ${res.status}`);
    } catch (err) {
      return this.markFailure(d, err instanceof Error ? err.message : 'delivery error');
    }
  }

  private async markFailure(d: DeliveryRecord, error: string): Promise<DeliveryOutcome> {
    const attempts = d.attempts + 1;
    const status: DeliveryOutcome = attempts >= this.maxAttempts ? 'DEAD' : 'FAILED';
    await this.prisma.webhookDelivery.update({
      where: { id: d.id },
      data: { status, attempts, lastError: error },
    });
    return status;
  }
}
