import { generateKeyPairSync, sign as cryptoSign } from 'node:crypto';
import { loadEd25519PublicKey, verifyEd25519 } from './webhook-ed25519';

describe('webhook-ed25519', () => {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const pem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
  const key = loadEd25519PublicKey(pem);
  const message = '1752969600000.{"type":"trustee.ping"}';
  const sign = (m: string) => cryptoSign(null, Buffer.from(m, 'utf8'), privateKey);

  it('accepts a valid base64 signature', () => {
    expect(verifyEd25519(key, message, sign(message).toString('base64'))).toBe(true);
  });

  it('accepts a valid base64url signature', () => {
    expect(verifyEd25519(key, message, sign(message).toString('base64url'))).toBe(true);
  });

  it('accepts a valid hex signature', () => {
    expect(verifyEd25519(key, message, sign(message).toString('hex'))).toBe(true);
  });

  it('rejects a signature over a different message', () => {
    expect(verifyEd25519(key, message + 'x', sign(message).toString('base64'))).toBe(false);
  });

  it('rejects a signature from a different key', () => {
    const other = generateKeyPairSync('ed25519').privateKey;
    const sig = cryptoSign(null, Buffer.from(message, 'utf8'), other).toString('base64');
    expect(verifyEd25519(key, message, sig)).toBe(false);
  });

  it('rejects a malformed signature without throwing', () => {
    expect(verifyEd25519(key, message, 'not-a-signature')).toBe(false);
    expect(verifyEd25519(key, message, '')).toBe(false);
  });

  it('throws on a non-ed25519 public key', () => {
    const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const rsaPem = rsa.publicKey.export({ type: 'spki', format: 'pem' }).toString();
    expect(() => loadEd25519PublicKey(rsaPem)).toThrow(/ed25519/i);
  });
});
