import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { hashPassword, verifyPassword } from './password';

/**
 * API client secrets (§34, §41).
 *
 * Client secrets are bearer credentials for a whole tenant, so they are treated like passwords:
 * scrypt (memory-hard) with a per-secret salt, verified in constant time. The original scheme
 * was a bare unsalted SHA-256 — fine as a placeholder for a seeded demo client, but unsuitable
 * for credentials issued to third parties: a database leak would expose every secret to an
 * offline dictionary attack at GPU speed, with no per-secret work factor.
 *
 * Legacy SHA-256 hashes are still *verified* so existing clients keep working, and callers can
 * transparently re-hash them on the next successful auth (see `needsRehash`). New secrets are
 * always scrypt.
 */

/** 32 bytes of CSPRNG entropy, base64url — no ambiguous characters, safe in headers and env vars. */
export function generateClientSecret(): string {
  return randomBytes(32).toString('base64url');
}

/** A readable, unambiguous client id: `pk_live_<random>` style prefix aids log triage. */
export function generateClientId(prefix = 'pc'): string {
  return `${prefix}_${randomBytes(12).toString('base64url')}`;
}

export function hashClientSecret(secret: string): string {
  return hashPassword(secret);
}

const LEGACY_SHA256 = /^[0-9a-f]{64}$/i;

export interface ClientSecretVerification {
  ok: boolean;
  /** True when the stored hash used the legacy unsalted SHA-256 scheme. Re-hash on success. */
  needsRehash: boolean;
}

/**
 * Verify a presented secret against either scheme, always in constant time. Returns whether the
 * stored hash should be upgraded, so the caller can migrate credentials without a flag day.
 */
export function verifyClientSecret(secret: string, stored: string): ClientSecretVerification {
  if (LEGACY_SHA256.test(stored)) {
    const presented = createHash('sha256').update(secret).digest();
    const expected = Buffer.from(stored, 'hex');
    const ok =
      presented.length === expected.length && timingSafeEqual(presented, expected);
    return { ok, needsRehash: ok };
  }
  return { ok: verifyPassword(secret, stored), needsRehash: false };
}
