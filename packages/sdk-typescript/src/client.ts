import { randomUUID } from 'node:crypto';
import { verifyWebhook } from './webhook-signature';

export interface PayChainClientOptions {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  /** Injectable fetch (defaults to global fetch). */
  fetchImpl?: typeof fetch;
  /** Max retry attempts for transient failures (429/5xx/network). Default 3. */
  maxRetries?: number;
}

export class PayChainError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'PayChainError';
  }
}

interface RequestOptions {
  body?: unknown;
  idempotencyKey?: string;
  correlationId?: string;
  /** Whether this is a state-changing write (auto-attaches an Idempotency-Key). */
  write?: boolean;
}

/**
 * PayChain TypeScript SDK (§38). Handles OAuth2 client-credentials auth with token caching,
 * automatic Idempotency-Key on writes, correlation ids, transient-failure retries with
 * backoff, typed errors, and webhook signature verification.
 */
export class PayChainClient {
  private readonly fetchImpl: typeof fetch;
  private readonly maxRetries: number;
  private token?: { value: string; expiresAtMs: number };

  readonly wallets: {
    create: (input: { ownerType: string; ownerReference: string }, key?: string) => Promise<unknown>;
    get: (walletId: string) => Promise<unknown>;
    balances: (walletId: string) => Promise<unknown>;
  };
  readonly assets: {
    create: (input: Record<string, unknown>, key?: string) => Promise<unknown>;
    activate: (assetId: string) => Promise<unknown>;
    issue: (assetId: string, input: { destinationWalletId: string; amount: string }, key?: string) => Promise<unknown>;
    transfer: (assetId: string, input: { sourceWalletId: string; destinationWalletId: string; amount: string }, key?: string) => Promise<unknown>;
    redeem: (assetId: string, input: { sourceWalletId: string; amount: string }, key?: string) => Promise<unknown>;
    burn: (assetId: string, input: { walletId: string; amount: string }, key?: string) => Promise<unknown>;
    earn: (assetId: string, input: { walletId: string; spendAmount: string; currency: string; merchantId?: string }, key?: string) => Promise<unknown>;
  };
  readonly transactions: {
    get: (id: string) => Promise<unknown>;
    compensate: (id: string, input: { amount: string; reason: string }, key?: string) => Promise<unknown>;
    approveCompensation: (compensationId: string) => Promise<unknown>;
  };

  constructor(private readonly options: PayChainClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.maxRetries = options.maxRetries ?? 3;

    this.wallets = {
      create: (input, key) => this.request('POST', '/wallets', { body: input, write: true, idempotencyKey: key }),
      get: (walletId) => this.request('GET', `/wallets/${walletId}`),
      balances: (walletId) => this.request('GET', `/wallets/${walletId}/balances`),
    };
    this.assets = {
      create: (input, key) => this.request('POST', '/assets', { body: input, write: true, idempotencyKey: key }),
      activate: (assetId) => this.request('POST', `/assets/${assetId}/activate`, { write: false }),
      issue: (assetId, input, key) => this.request('POST', `/assets/${assetId}/issue`, { body: input, write: true, idempotencyKey: key }),
      transfer: (assetId, input, key) => this.request('POST', `/assets/${assetId}/transfer`, { body: input, write: true, idempotencyKey: key }),
      redeem: (assetId, input, key) => this.request('POST', `/assets/${assetId}/redeem`, { body: input, write: true, idempotencyKey: key }),
      burn: (assetId, input, key) => this.request('POST', `/assets/${assetId}/burn`, { body: input, write: true, idempotencyKey: key }),
      earn: (assetId, input, key) => this.request('POST', `/assets/${assetId}/earn`, { body: input, write: true, idempotencyKey: key }),
    };
    this.transactions = {
      get: (id) => this.request('GET', `/transactions/${id}`),
      compensate: (id, input, key) => this.request('POST', `/transactions/${id}/compensate`, { body: input, write: true, idempotencyKey: key }),
      approveCompensation: (compensationId) => this.request('POST', `/transactions/compensations/${compensationId}/approve`),
    };
  }

  /** Verify an inbound webhook signature (§35). */
  static verifyWebhook(secret: string, body: string, signatureHeader: string, timestamp: string): boolean {
    return verifyWebhook(secret, body, signatureHeader, timestamp);
  }

  private async getToken(): Promise<string> {
    const now = Date.now();
    if (this.token && this.token.expiresAtMs - now > 30_000) return this.token.value;

    const res = await this.fetchImpl(`${this.options.baseUrl}/api/v1/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: this.options.clientId,
        client_secret: this.options.clientSecret,
      }),
    });
    if (!res.ok) {
      throw new PayChainError(res.status, 'AUTH_FAILED', 'Failed to obtain access token');
    }
    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.token = { value: data.access_token, expiresAtMs: now + data.expires_in * 1000 };
    return this.token.value;
  }

  private async request(method: string, path: string, opts: RequestOptions = {}): Promise<unknown> {
    const correlationId = opts.correlationId ?? randomUUID();
    const idempotencyKey = opts.write ? opts.idempotencyKey ?? randomUUID() : undefined;

    // Only auto-retry requests that are SAFE to replay: reads (GET) and writes that carry an
    // Idempotency-Key (the server dedupes them). A write WITHOUT a key (e.g. an approval) must
    // NOT be retried — a retry after a committed-but-timed-out response would double-execute.
    const canRetry = method === 'GET' || Boolean(idempotencyKey);

    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const token = await this.getToken();
        const headers: Record<string, string> = {
          Authorization: `Bearer ${token}`,
          'X-Correlation-Id': correlationId,
        };
        if (opts.body) headers['Content-Type'] = 'application/json';
        if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

        const res = await this.fetchImpl(`${this.options.baseUrl}/api/v1${path}`, {
          method,
          headers,
          body: opts.body ? JSON.stringify(opts.body) : undefined,
        });

        if (res.status >= 500 || res.status === 429) {
          const transient = new PayChainError(res.status, 'TRANSIENT', `Transient error ${res.status}`);
          if (!canRetry || attempt >= this.maxRetries) throw transient;
          lastErr = transient;
          await this.backoff(attempt);
          continue;
        }
        if (!res.ok) {
          const detail = await this.safeJson(res);
          throw new PayChainError(res.status, 'REQUEST_FAILED', `Request failed (${res.status})`, detail);
        }
        return res.status === 204 ? undefined : this.safeJson(res);
      } catch (err) {
        if (err instanceof PayChainError && err.code !== 'TRANSIENT') throw err;
        lastErr = err;
        // Network error / transient: retry only if safe.
        if (!canRetry || attempt >= this.maxRetries) throw err;
        await this.backoff(attempt);
      }
    }
    throw lastErr instanceof Error
      ? lastErr
      : new PayChainError(0, 'NETWORK', 'Request failed after retries');
  }

  private async backoff(attempt: number): Promise<void> {
    const ms = Math.min(1000 * 2 ** attempt, 8000);
    await new Promise((r) => setTimeout(r, ms));
  }

  private async safeJson(res: Response): Promise<unknown> {
    try {
      return await res.json();
    } catch {
      return undefined;
    }
  }
}
