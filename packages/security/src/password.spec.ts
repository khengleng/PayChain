import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  it('verifies a correct password and rejects a wrong one', () => {
    const hash = hashPassword('s3cret-Passw0rd');
    expect(verifyPassword('s3cret-Passw0rd', hash)).toBe(true);
    expect(verifyPassword('wrong', hash)).toBe(false);
  });

  it('produces a distinct salted hash each time', () => {
    expect(hashPassword('same')).not.toBe(hashPassword('same'));
  });

  it('rejects a malformed stored hash', () => {
    expect(verifyPassword('x', 'not-a-valid-hash')).toBe(false);
  });
});
