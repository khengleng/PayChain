import { signWebhook, verifyWebhook as verifyFromServer } from '@paychain/security';
import { verifyWebhook } from './webhook-signature';

/**
 * Pins the SDK's inlined verifier against the server's real signer.
 *
 * The SDK cannot import @paychain/security — it is a workspace:* package and the SDK ships to
 * other repos. So the verifier is duplicated, and a duplicated signature check is exactly the
 * kind of thing that drifts: the server changes its scheme, this file does not, and either real
 * webhooks start failing or forged ones start passing.
 *
 * This test imports BOTH and asserts they agree. It is a devDependency-only import, so it never
 * reaches the published package. If someone changes the signing scheme on either side, this goes
 * red — which is the entire point of keeping the copy honest.
 */
describe('SDK webhook verifier ↔ server signer (contract)', () => {
  const secret = 'whsec_test_secret';
  const body = JSON.stringify({ event: 'asset.issued', transactionId: 'tx_1' });
  const now = 1_770_000_000_000;

  it('accepts a signature produced by the server signer', () => {
    const { signature, timestamp } = signWebhook(secret, body, now);
    expect(verifyWebhook(secret, body, signature, timestamp, 5 * 60 * 1000, now)).toBe(true);
  });

  it('agrees with the server verifier across the cases that matter', () => {
    const { signature, timestamp } = signWebhook(secret, body, now);
    const cases: Array<[string, () => boolean, () => boolean]> = [
      [
        'wrong secret',
        () => verifyWebhook('nope', body, signature, timestamp, 5 * 60 * 1000, now),
        () => verifyFromServer('nope', body, signature, timestamp, 5 * 60 * 1000, now),
      ],
      [
        'tampered body',
        () => verifyWebhook(secret, `${body} `, signature, timestamp, 5 * 60 * 1000, now),
        () => verifyFromServer(secret, `${body} `, signature, timestamp, 5 * 60 * 1000, now),
      ],
      [
        'stale timestamp (replay)',
        () => verifyWebhook(secret, body, signature, timestamp, 5 * 60 * 1000, now + 10 * 60 * 1000),
        () => verifyFromServer(secret, body, signature, timestamp, 5 * 60 * 1000, now + 10 * 60 * 1000),
      ],
      [
        'garbage timestamp',
        () => verifyWebhook(secret, body, signature, 'abc', 5 * 60 * 1000, now),
        () => verifyFromServer(secret, body, signature, 'abc', 5 * 60 * 1000, now),
      ],
    ];

    for (const [name, sdk, server] of cases) {
      expect([name, sdk()]).toEqual([name, server()]);
    }
  });
});
