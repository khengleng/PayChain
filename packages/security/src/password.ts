import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * Password hashing for admin users (§41). Uses scrypt (memory-hard) with a per-password salt.
 * Serialized as "scrypt$<saltHex>$<hashHex>". Comparison is constant-time.
 */
const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, KEYLEN);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const salt = Buffer.from(parts[1]!, 'hex');
  const expected = Buffer.from(parts[2]!, 'hex');
  const derived = scryptSync(password, salt, expected.length || KEYLEN);
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}
