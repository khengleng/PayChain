import { createHash } from 'node:crypto';
import {
  generateClientId,
  generateClientSecret,
  hashClientSecret,
  verifyClientSecret,
} from './client-secret';

describe('client secrets', () => {
  it('generates high-entropy, URL-safe secrets that never repeat', () => {
    const secrets = new Set(Array.from({ length: 200 }, () => generateClientSecret()));
    expect(secrets.size).toBe(200);
    for (const s of secrets) {
      expect(s).toMatch(/^[A-Za-z0-9_-]+$/); // base64url: safe in headers, env vars, .env files
      expect(s.length).toBeGreaterThanOrEqual(43); // 32 bytes of entropy
    }
  });

  it('generates unique, prefixed client ids for log triage', () => {
    const ids = new Set(Array.from({ length: 200 }, () => generateClientId('paykh')));
    expect(ids.size).toBe(200);
    expect([...ids][0]).toMatch(/^paykh_[A-Za-z0-9_-]+$/);
  });

  it('salts: the same secret hashes differently every time', () => {
    const secret = 'correct horse battery staple';
    const a = hashClientSecret(secret);
    const b = hashClientSecret(secret);
    expect(a).not.toBe(b); // no rainbow tables, no "same hash = same secret" inference
    expect(verifyClientSecret(secret, a).ok).toBe(true);
    expect(verifyClientSecret(secret, b).ok).toBe(true);
  });

  it('never stores the secret in the hash', () => {
    const secret = generateClientSecret();
    expect(hashClientSecret(secret)).not.toContain(secret);
  });

  it('accepts the right secret and rejects wrong ones', () => {
    const secret = generateClientSecret();
    const stored = hashClientSecret(secret);
    expect(verifyClientSecret(secret, stored).ok).toBe(true);
    expect(verifyClientSecret(`${secret}x`, stored).ok).toBe(false);
    expect(verifyClientSecret('', stored).ok).toBe(false);
    expect(verifyClientSecret(secret.slice(0, -1), stored).ok).toBe(false);
  });

  it('does not ask for a rehash when already scrypt', () => {
    const secret = generateClientSecret();
    expect(verifyClientSecret(secret, hashClientSecret(secret)).needsRehash).toBe(false);
  });

  describe('legacy unsalted SHA-256 (pre-existing clients)', () => {
    const secret = 'demo-secret';
    const legacy = createHash('sha256').update(secret).digest('hex');

    it('still verifies, so existing clients keep working', () => {
      expect(verifyClientSecret(secret, legacy).ok).toBe(true);
    });

    it('flags a rehash so the credential upgrades on next use', () => {
      expect(verifyClientSecret(secret, legacy).needsRehash).toBe(true);
    });

    it('rejects a wrong secret and does not request a rehash', () => {
      const res = verifyClientSecret('wrong', legacy);
      expect(res.ok).toBe(false);
      expect(res.needsRehash).toBe(false);
    });
  });

  it('rejects malformed stored hashes rather than throwing', () => {
    for (const bad of ['', 'garbage', 'scrypt$onlytwo', 'scrypt$zz$zz']) {
      expect(() => verifyClientSecret('x', bad)).not.toThrow();
      expect(verifyClientSecret('x', bad).ok).toBe(false);
    }
  });
});
