import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * TOTP (RFC 6238) for admin MFA — compatible with Google Authenticator / Authy / 1Password.
 * SHA-1, 6 digits, 30s period. No external dependency.
 */
const DIGITS = 6;
const PERIOD = 30;
const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const ch of clean) {
    const idx = B32_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** A fresh base32 TOTP secret (160-bit). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** otpauth:// provisioning URI to seed an authenticator app (via QR or manual entry). */
export function totpUri(email: string, secret: string, issuer = 'PayChain'): string {
  // The issuer:account colon is a literal separator; only the parts are encoded.
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(email)}`;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(DIGITS),
    period: String(PERIOD),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter));
  const digest = createHmac('sha1', secret).update(buf).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const code =
    ((digest[offset]! & 0x7f) << 24) |
    ((digest[offset + 1]! & 0xff) << 16) |
    ((digest[offset + 2]! & 0xff) << 8) |
    (digest[offset + 3]! & 0xff);
  return (code % 10 ** DIGITS).toString().padStart(DIGITS, '0');
}

/** Verifies a 6-digit token against the secret, tolerating ±`window` periods of clock skew. */
export function verifyTotp(secret: string, token: string, window = 1, nowMs?: number): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  const key = base32Decode(secret);
  const counter = Math.floor((nowMs ?? Date.now()) / 1000 / PERIOD);
  const provided = Buffer.from(token);
  for (let i = -window; i <= window; i += 1) {
    const candidate = Buffer.from(hotp(key, counter + i));
    if (candidate.length === provided.length && timingSafeEqual(candidate, provided)) return true;
  }
  return false;
}

/** Test/helper: current code for a secret (used to bootstrap the enrollment demo). */
export function currentTotp(secret: string, nowMs?: number): string {
  const counter = Math.floor((nowMs ?? Date.now()) / 1000 / PERIOD);
  return hotp(base32Decode(secret), counter);
}
