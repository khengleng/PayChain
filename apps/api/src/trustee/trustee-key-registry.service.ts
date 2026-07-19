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
  /**
   * PayChain-side pinned keys per purpose — the trust anchor of last resort when the JWKS is
   * unreachable. WEBHOOK has always been pinned; RESERVE_SNAPSHOT is now pinned too so the reserve
   * figure the ratio is decided against is not hostage to the JWKS endpoint alone.
   */
  private readonly pinned = new Map<TrusteeKeyPurpose, { keyId: string; key: KeyObject }>();

  constructor(
    @Inject(CONFIG) config: PayChainConfig,
    // @Optional so Nest injects undefined under real DI (these are function types with no provider)
    // and the TS defaults apply; tests still pass explicit fakes via the constructor.
    @Optional() private readonly fetcher: JwksFetcher = defaultFetcher,
    @Optional() private readonly now: () => number = () => Date.now(),
  ) {
    this.jwksUrl = config.TRUSTEE_JWKS_URL;
    this.loadPin('WEBHOOK', config.TRUSTEE_WEBHOOK_PUBLIC_KEY, config.TRUSTEE_WEBHOOK_KEY_ID);
    this.loadPin(
      'RESERVE_SNAPSHOT',
      config.TRUSTEE_RESERVE_SNAPSHOT_PUBLIC_KEY,
      config.TRUSTEE_RESERVE_SNAPSHOT_KEY_ID,
    );
  }

  /** Load a pinned key for a purpose from config, if a valid PEM is provided. */
  private loadPin(purpose: TrusteeKeyPurpose, pem: string | undefined, keyId: string): void {
    const raw = (pem ?? '').trim();
    if (!raw) return;
    try {
      this.pinned.set(purpose, { keyId, key: loadEd25519PublicKey(raw) });
    } catch (err) {
      this.logger.error(`Pinned trustee ${purpose} key is invalid: ${msg(err)}`);
    }
  }

  /**
   * Resolve a verification key by purpose + keyId. Refreshes the JWKS lazily (stale cache) and once
   * more on a keyId miss (rotation). Returns the pinned webhook key as a last resort for WEBHOOK.
   */
  async getKey(purpose: TrusteeKeyPurpose, keyId: string): Promise<KeyObject | null> {
    let key = this.lookup(purpose, keyId);
    if (key) return key;

    // At most ONE fetch per lookup: refresh (forced only if the cache is currently fresh, i.e. the
    // miss is a possible rotation; otherwise a normal stale/empty refresh), then look up once more.
    const forceForRotation = !this.isStale() && this.cache.size > 0;
    await this.refresh(forceForRotation);
    key = this.lookup(purpose, keyId);
    if (key) return key;

    // Last resort: a PayChain-side pinned key for this purpose (WEBHOOK, RESERVE_SNAPSHOT). Only
    // honoured when the delivery's keyId is unset or matches the pinned id — never a blanket accept.
    const pin = this.pinned.get(purpose);
    if (pin && (!keyId || keyId === pin.keyId)) {
      return pin.key;
    }
    return null;
  }

  /**
   * Whether any WEBHOOK verification material exists at all (pinned key or a fetched JWKS key).
   * Lets the receiver return 503 ("not configured") vs 401 ("unknown key id") correctly.
   */
  async hasWebhookKeys(): Promise<boolean> {
    if (this.pinned.has('WEBHOOK')) return true;
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
