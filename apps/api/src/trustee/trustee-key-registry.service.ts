import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { KeyObject } from 'node:crypto';
import { loadEd25519PublicKey } from '@paychain/security';
import type { PayChainConfig } from '@paychain/config';
import { CONFIG } from '../config/config.module';
import type { TrusteeKeyPurpose } from './trustee-events';

interface JwksEntry {
  purpose: string;
  keyId: string;
  publicKeyPem: string;
}

/** Injected so unit tests can supply a fake without hitting the network. */
export type JwksFetcher = (url: string) => Promise<{ keys: JwksEntry[] }>;

const defaultFetcher: JwksFetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`JWKS fetch ${url} returned HTTP ${res.status}`);
  return (await res.json()) as { keys: JwksEntry[] };
};

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Fetches and caches the trustee's published JWKS (packages of purpose-specific Ed25519 keys) so
 * the receiver can verify inner signed artifacts (mint authorizations, reserve snapshots,
 * attestations) with the right key. Lazy cache-on-read with a TTL; a keyId miss forces a single
 * refresh (covers rotation) before giving up. If the JWKS is unreachable, WEBHOOK verification
 * falls back to the pinned TRUSTEE_WEBHOOK_PUBLIC_KEY so today's working envelope path never
 * regresses. Everything fails closed to null — callers reject when a key cannot be resolved.
 */
@Injectable()
export class TrusteeKeyRegistry {
  private readonly logger = new Logger(TrusteeKeyRegistry.name);
  private readonly jwksUrl: string;
  /** purpose -> keyId -> key */
  private cache = new Map<string, Map<string, KeyObject>>();
  private fetchedAt = 0;
  private readonly pinnedWebhookKey: KeyObject | null;
  private readonly pinnedWebhookKeyId: string;

  constructor(
    @Inject(CONFIG) config: PayChainConfig,
    // @Optional so Nest injects undefined under real DI (these are function types with no provider)
    // and the TS defaults apply; tests still pass explicit fakes via the constructor.
    @Optional() private readonly fetcher: JwksFetcher = defaultFetcher,
    @Optional() private readonly now: () => number = () => Date.now(),
  ) {
    this.jwksUrl = config.TRUSTEE_JWKS_URL;
    this.pinnedWebhookKeyId = config.TRUSTEE_WEBHOOK_KEY_ID;
    let pinned: KeyObject | null = null;
    const raw = (config.TRUSTEE_WEBHOOK_PUBLIC_KEY ?? '').trim();
    if (raw) {
      try {
        pinned = loadEd25519PublicKey(raw);
      } catch (err) {
        this.logger.error(`Pinned TRUSTEE_WEBHOOK_PUBLIC_KEY is invalid: ${msg(err)}`);
      }
    }
    this.pinnedWebhookKey = pinned;
  }

  /**
   * Resolve a verification key by purpose + keyId. Refreshes the JWKS lazily (stale cache) and once
   * more on a keyId miss (rotation). Returns the pinned webhook key as a last resort for WEBHOOK.
   */
  async getKey(purpose: TrusteeKeyPurpose, keyId: string): Promise<KeyObject | null> {
    let key = this.lookup(purpose, keyId);
    if (key) return key;

    if (this.isStale() || !this.cache.size) {
      await this.refresh();
      key = this.lookup(purpose, keyId);
      if (key) return key;
    }
    // Fresh-but-missing keyId: one forced refresh in case of a just-published rotation.
    if (!this.isStale()) {
      await this.refresh(true);
      key = this.lookup(purpose, keyId);
      if (key) return key;
    }
    if (purpose === 'WEBHOOK' && (!keyId || keyId === this.pinnedWebhookKeyId)) {
      return this.pinnedWebhookKey;
    }
    return null;
  }

  /**
   * Whether any WEBHOOK verification material exists at all (pinned key or a fetched JWKS key).
   * Lets the receiver return 503 ("not configured") vs 401 ("unknown key id") correctly.
   */
  async hasWebhookKeys(): Promise<boolean> {
    if (this.pinnedWebhookKey) return true;
    if (this.isStale() || !this.cache.size) await this.refresh();
    return (this.cache.get('WEBHOOK')?.size ?? 0) > 0;
  }

  private lookup(purpose: string, keyId: string): KeyObject | null {
    return this.cache.get(purpose)?.get(keyId) ?? null;
  }

  private isStale(): boolean {
    return this.now() - this.fetchedAt > CACHE_TTL_MS;
  }

  private async refresh(force = false): Promise<void> {
    if (!force && !this.isStale() && this.cache.size) return;
    try {
      const { keys } = await this.fetcher(this.jwksUrl);
      const next = new Map<string, Map<string, KeyObject>>();
      for (const entry of keys ?? []) {
        if (!entry?.purpose || !entry?.keyId || !entry?.publicKeyPem) continue;
        try {
          const key = loadEd25519PublicKey(entry.publicKeyPem);
          if (!next.has(entry.purpose)) next.set(entry.purpose, new Map());
          next.get(entry.purpose)!.set(entry.keyId, key);
        } catch (err) {
          this.logger.warn(`Skipping unusable JWKS key ${entry.purpose}/${entry.keyId}: ${msg(err)}`);
        }
      }
      this.cache = next;
      this.fetchedAt = this.now();
    } catch (err) {
      // Keep the old cache (if any); WEBHOOK still has the pinned fallback. Do not throw.
      this.logger.error(`Trustee JWKS refresh failed (${this.jwksUrl}): ${msg(err)}`);
    }
  }
}

function msg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
