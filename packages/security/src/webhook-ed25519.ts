import { createPublicKey, verify as cryptoVerify, type KeyObject } from 'node:crypto';

/**
 * Ed25519 webhook verification (asymmetric).
 *
 * Unlike the HMAC scheme in webhook-signature.ts (shared secret, both sides can sign), the trustee
 * platform signs its outbound webhooks with an Ed25519 *private* key and publishes only the
 * *public* key (keyId `webhook-v1`). PayChain can therefore verify authenticity but can never mint
 * a valid trustee signature — the right property for an inbound receiver.
 *
 * Ed25519 in Node uses the one-shot API with a null algorithm (the hash is part of the scheme).
 */

/**
 * Parse an Ed25519 SubjectPublicKeyInfo key, failing loudly on a non-Ed25519 key. Accepts either a
 * full PEM block or a bare base64 SPKI blob (no `-----BEGIN-----` armor) — the latter is what a
 * single-line env var often ends up holding when the armor is dropped. `\n`-escaped PEM is
 * normalized to real newlines first, so a Railway-style single-line value works too.
 */
export function loadEd25519PublicKey(input: string): KeyObject {
  const trimmed = input.trim().replace(/\\n/g, '\n');
  const key = trimmed.includes('BEGIN')
    ? createPublicKey({ key: trimmed, format: 'pem' })
    : createPublicKey({ key: Buffer.from(trimmed, 'base64'), format: 'der', type: 'spki' });
  if (key.asymmetricKeyType !== 'ed25519') {
    throw new Error(`Expected an ed25519 public key, got ${key.asymmetricKeyType ?? 'unknown'}`);
  }
  return key;
}

/**
 * Decode a signature that may arrive base64, base64url, or hex. The scheme's canonical encoding is
 * fixed by the contract; tolerating the common encodings here only affects how the 64 signature
 * bytes are read — the Ed25519 check itself is what actually gates authenticity, so a wrong guess
 * yields a failed verify (fail-closed), never a false accept.
 */
function decodeSignature(signature: string): Buffer | null {
  const s = signature.trim();
  if (/^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0) {
    const buf = Buffer.from(s, 'hex');
    if (buf.length === 64) return buf;
  }
  for (const enc of ['base64', 'base64url'] as const) {
    const buf = Buffer.from(s, enc);
    if (buf.length === 64) return buf;
  }
  return null;
}

/**
 * Verify an Ed25519 signature over `message` against `publicKey`. Returns false (never throws) on a
 * malformed signature or any verification failure, so callers can treat the boolean as the sole
 * authenticity gate.
 */
export function verifyEd25519(publicKey: KeyObject, message: string | Buffer, signature: string): boolean {
  const sig = decodeSignature(signature);
  if (!sig) return false;
  const data = typeof message === 'string' ? Buffer.from(message, 'utf8') : message;
  try {
    return cryptoVerify(null, data, publicKey, sig);
  } catch {
    return false;
  }
}
