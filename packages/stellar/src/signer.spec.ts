import { Account, BASE_FEE, Keypair, Networks, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { ExternalSignerNotConfigured, LocalDevSigner, selectSigner } from './signer';

const PASSPHRASE = Networks.TESTNET;

function unsignedTx(sourceKp: Keypair): string {
  const account = new Account(sourceKp.publicKey(), '1');
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: PASSPHRASE })
    .addOperation(Operation.bumpSequence({ bumpTo: '2' }))
    .setTimeout(30)
    .build();
  return tx.toXDR();
}

describe('LocalDevSigner', () => {
  it('appends a valid signature for a ref with an inline secret', async () => {
    const kp = Keypair.random();
    const signer = new LocalDevSigner();
    const signedXdr = await signer.sign({
      xdr: unsignedTx(kp),
      networkPassphrase: PASSPHRASE,
      signers: [{ publicKey: kp.publicKey(), secretKey: kp.secret() }],
    });
    const signed = TransactionBuilder.fromXDR(signedXdr, PASSPHRASE);
    expect(signed.signatures).toHaveLength(1);
    // The signature must verify against the signer's key + the tx hash.
    expect(kp.verify((signed as any).hash(), signed.signatures[0]!.signature())).toBe(true);
  });

  it('applies multiple signers (e.g. sponsor + new account)', async () => {
    const a = Keypair.random();
    const b = Keypair.random();
    const signer = new LocalDevSigner();
    const signedXdr = await signer.sign({
      xdr: unsignedTx(a),
      networkPassphrase: PASSPHRASE,
      signers: [
        { publicKey: a.publicKey(), secretKey: a.secret() },
        { publicKey: b.publicKey(), secretKey: b.secret() },
      ],
    });
    expect(TransactionBuilder.fromXDR(signedXdr, PASSPHRASE).signatures).toHaveLength(2);
  });

  it('REFUSES to sign a ref with no inline secret (never silently no-ops)', async () => {
    const kp = Keypair.random();
    const signer = new LocalDevSigner();
    await expect(
      signer.sign({ xdr: unsignedTx(kp), networkPassphrase: PASSPHRASE, signers: [{ publicKey: kp.publicKey() }] }),
    ).rejects.toThrow(/no secret/i);
  });
});

describe('ExternalSignerNotConfigured', () => {
  it('throws on sign until a real signer is wired', async () => {
    const signer = new ExternalSignerNotConfigured('hsm');
    await expect(signer.sign()).rejects.toThrow(/not configured/i);
    expect(await signer.health()).toEqual({ available: false, kind: 'hsm' });
  });
});

describe('selectSigner', () => {
  it('returns the in-process signer for local-dev', () => {
    expect(selectSigner('local-dev')).toBeInstanceOf(LocalDevSigner);
  });
  it('returns the not-configured placeholder for kms/hsm/mpc', () => {
    expect(selectSigner('hsm')).toBeInstanceOf(ExternalSignerNotConfigured);
    expect(selectSigner('kms')).toBeInstanceOf(ExternalSignerNotConfigured);
  });
});
