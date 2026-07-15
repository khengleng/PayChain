import { Inject, Injectable } from '@nestjs/common';
import type { PayChainConfig } from '@paychain/config';
import { SymmetricCrypto } from '@paychain/security';
import { CONFIG } from '../config/config.module';

/**
 * Dev-only symmetric encryption for secret keys at rest (§11), delegating to the shared
 * SymmetricCrypto so the API and worker encode/decode identically. This is the `local-dev`
 * key-management provider; production/pilot MUST use KMS/HSM/MPC (README §0.6, §11).
 */
@Injectable()
export class CryptoService {
  private readonly crypto: SymmetricCrypto;

  constructor(@Inject(CONFIG) cfg: PayChainConfig) {
    this.crypto = new SymmetricCrypto(cfg.KEY_ENCRYPTION_KEY);
  }

  encrypt(plaintext: string): string {
    return this.crypto.encrypt(plaintext);
  }

  decrypt(payload: string): string {
    return this.crypto.decrypt(payload);
  }

  /** Stable hash for API client secrets and idempotency request payloads. */
  static sha256(input: string): string {
    return SymmetricCrypto.sha256(input);
  }
}
