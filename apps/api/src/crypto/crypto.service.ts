import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { PayChainConfig } from '@paychain/config';
import { CONFIG } from '../config/config.module';

/**
 * Dev-only symmetric encryption for Stellar secret keys at rest (§11).
 *
 * This is the `local-dev` key-management provider. It satisfies "never store plaintext
 * private keys" for development and testnet. Production/pilot MUST use KMS/HSM/MPC
 * (README §0.6, §11); this service is intentionally a hard gate, not the end state.
 */
@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(@Inject(CONFIG) cfg: PayChainConfig) {
    // Derive a stable 32-byte key from the configured secret.
    this.key = createHash('sha256').update(cfg.KEY_ENCRYPTION_KEY).digest();
  }

  /** Encrypts a secret to a compact "iv.tag.ciphertext" base64 string. */
  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join('.');
  }

  decrypt(payload: string): string {
    const [ivB64, tagB64, dataB64] = payload.split('.');
    if (!ivB64 || !tagB64 || !dataB64) {
      throw new Error('Malformed encrypted payload');
    }
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }

  /** Stable hash for API client secrets and idempotency request payloads. */
  static sha256(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }
}
