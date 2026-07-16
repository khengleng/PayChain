import { base32Decode, base32Encode, currentTotp, generateTotpSecret, totpUri, verifyTotp } from './totp';

describe('TOTP (RFC 6238)', () => {
  it('base32 round-trips', () => {
    const buf = Buffer.from('hello totp world!');
    expect(base32Decode(base32Encode(buf)).toString()).toBe(buf.toString());
  });

  it('verifies the current code and rejects a wrong one', () => {
    const secret = generateTotpSecret();
    const now = 1_700_000_000_000;
    const code = currentTotp(secret, now);
    expect(verifyTotp(secret, code, 1, now)).toBe(true);
    expect(verifyTotp(secret, '000000', 1, now)).toBe(false);
  });

  it('tolerates one period of clock skew but not two', () => {
    const secret = generateTotpSecret();
    const now = 1_700_000_000_000;
    const prevCode = currentTotp(secret, now - 30_000);
    expect(verifyTotp(secret, prevCode, 1, now)).toBe(true);
    const wayOff = currentTotp(secret, now - 90_000);
    expect(verifyTotp(secret, wayOff, 1, now)).toBe(false);
  });

  it('rejects non-6-digit input', () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, 'abcdef')).toBe(false);
    expect(verifyTotp(secret, '12345')).toBe(false);
  });

  it('builds an otpauth uri', () => {
    const uri = totpUri('admin@x.com', 'ABCDEF', 'PayChain');
    expect(uri).toContain('otpauth://totp/PayChain:admin%40x.com');
    expect(uri).toContain('secret=ABCDEF');
  });
});
