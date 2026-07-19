import { Account, Keypair, Networks } from '@stellar/stellar-sdk';
import { StellarProvider } from './stellar-provider';
import { ExternalSignerNotConfigured, LocalDevSigner, type SignRequest } from './signer';

function fakeServer(onSubmit: (env: unknown) => Promise<{ hash: string; ledger: number; successful: boolean }>) {
  return {
    loadAccount: async (pk: string) => new Account(pk, '100'),
    submitTransaction: onSubmit,
  } as never;
}

// A signer that records every request but produces REAL signatures (delegates to LocalDevSigner),
// so the fee-bump build (which wraps a signed inner tx) works exactly as on a real network.
function spySigner() {
  const local = new LocalDevSigner();
  const calls: SignRequest[] = [];
  return {
    calls,
    signer: {
      sign: async (r: SignRequest) => {
        calls.push(r);
        return local.sign(r);
      },
      health: async () => ({ available: true, kind: 'spy' }),
    },
  };
}

describe('StellarProvider — signing goes through the seam', () => {
  it('issueAsset signs via the signer and submits the signed envelope', async () => {
    const issuer = Keypair.random();
    const dest = Keypair.random();
    const { calls, signer } = spySigner();
    const submitted: unknown[] = [];
    const provider = new StellarProvider({
      network: 'testnet',
      horizonUrl: 'http://localhost',
      networkPassphrase: Networks.TESTNET,
      signer,
      server: fakeServer(async (env) => {
        submitted.push(env);
        return { hash: 'HASH1', ledger: 1, successful: true };
      }),
    });

    const res = await provider.issueAsset({
      correlationId: 'c',
      assetCode: 'PAYC',
      issuerPublicKey: issuer.publicKey(),
      issuerSecretKey: issuer.secret(),
      destinationPublicKey: dest.publicKey(),
      amount: '10',
    });

    expect(res).toEqual({ transactionHash: 'HASH1', submitted: true });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.signers.map((s) => s.publicKey)).toEqual([issuer.publicKey()]);
    expect(submitted).toHaveLength(1);
  });

  it('fee-bumps through the SAME seam when a sponsor is configured (sponsor key never inline)', async () => {
    const issuer = Keypair.random();
    const dest = Keypair.random();
    const sponsor = Keypair.random();
    const { calls, signer } = spySigner();
    const provider = new StellarProvider({
      network: 'testnet',
      horizonUrl: 'http://localhost',
      networkPassphrase: Networks.TESTNET,
      sponsorPublicKey: sponsor.publicKey(),
      sponsorSecretKey: sponsor.secret(),
      signer,
      server: fakeServer(async () => ({ hash: 'HASH2', ledger: 1, successful: true })),
    });

    await provider.issueAsset({
      correlationId: 'c',
      assetCode: 'PAYC',
      issuerPublicKey: issuer.publicKey(),
      issuerSecretKey: issuer.secret(),
      destinationPublicKey: dest.publicKey(),
      amount: '5',
    });

    // Inner tx signed once, then the fee-bump envelope signed by the sponsor — two seam calls.
    expect(calls).toHaveLength(2);
    expect(calls[0]!.signers.map((s) => s.publicKey)).toEqual([issuer.publicKey()]);
    expect(calls[1]!.signers.map((s) => s.publicKey)).toEqual([sponsor.publicKey()]);
  });

  it('fails closed when built with the not-configured external signer (no signing possible)', async () => {
    const issuer = Keypair.random();
    const dest = Keypair.random();
    const provider = new StellarProvider({
      network: 'testnet',
      horizonUrl: 'http://localhost',
      networkPassphrase: Networks.TESTNET,
      signer: new ExternalSignerNotConfigured('hsm'),
      server: fakeServer(async () => ({ hash: 'X', ledger: 1, successful: true })),
    });

    await expect(
      provider.issueAsset({
        correlationId: 'c',
        assetCode: 'PAYC',
        issuerPublicKey: issuer.publicKey(),
        issuerSecretKey: issuer.secret(),
        destinationPublicKey: dest.publicKey(),
        amount: '1',
      }),
    ).rejects.toThrow(/not configured/i);
  });
});
