import { compareLedgers } from './dual-run';
import { DisabledStablecoinFeatures, StablecoinFeaturesDisabledError } from './stablecoin-preview';
import { handleWebhook } from './webhook-handler';

describe('compareLedgers (dual-run §44)', () => {
  it('is clean when both ledgers match', () => {
    const r = compareLedgers(
      [{ reference: 'a', points: 10 }, { reference: 'b', points: 5 }],
      [{ reference: 'a', points: 10 }, { reference: 'b', points: 5 }],
    );
    expect(r.clean).toBe(true);
    expect(r.matched).toBe(2);
  });

  it('flags value mismatches and one-sided entries', () => {
    const r = compareLedgers(
      [{ reference: 'a', points: 10 }, { reference: 'b', points: 5 }],
      [{ reference: 'a', points: 9 }, { reference: 'c', points: 1 }],
    );
    expect(r.clean).toBe(false);
    const kinds = r.mismatches.map((m) => m.kind).sort();
    expect(kinds).toEqual(['MISSING_IN_LEGACY', 'MISSING_IN_PAYCHAIN', 'VALUE_MISMATCH']);
  });
});

describe('stablecoin preview is disabled (loyalty-only §44)', () => {
  it('every capability refuses until enabled + readiness gates pass', async () => {
    const features = new DisabledStablecoinFeatures();
    await expect(features.displayStablecoinBalance()).rejects.toBeInstanceOf(StablecoinFeaturesDisabledError);
    await expect(features.convertPointsToStablecoin()).rejects.toBeInstanceOf(StablecoinFeaturesDisabledError);
  });
});

describe('webhook handling (§35)', () => {
  // Import the signer from the SDK's security dep transitively via a real signature.
  it('rejects an unsigned/invalid webhook', async () => {
    await expect(
      handleWebhook('secret', JSON.stringify({ x: 1 }), { 'x-paychain-signature': 'sha256=bad', 'x-paychain-timestamp': String(Date.now()) }, {}),
    ).rejects.toThrow();
  });
});
