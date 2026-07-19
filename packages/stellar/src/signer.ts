import { Keypair, TransactionBuilder } from '@stellar/stellar-sdk';

/**
 * A key the signer must apply. `secretKey` is populated ONLY by the local-dev signer (the key is in
 * process memory). A real HSM/KMS signer resolves the private key by `publicKey` inside the secure
 * boundary and ignores `secretKey` — the raw secret never leaves the vault.
 */
export interface SignerRef {
  publicKey: string;
  secretKey?: string;
}

export interface SignRequest {
  /** base64 XDR of the transaction (or fee-bump) envelope to append signatures to. */
  xdr: string;
  networkPassphrase: string;
  signers: SignerRef[];
}

/**
 * The signing seam (§0.6, §11). StellarProvider builds and submits transactions but never signs
 * inline — it hands the unsigned XDR here. In dev this is the in-process LocalDevSigner; in
 * production it is an external HSM/KMS signer where the private key never enters application memory.
 * This is the boundary that must exist before mainnet issuance: config fails closed until a
 * non-local-dev signer is configured.
 */
export interface TransactionSigner {
  /** Returns the base64 XDR of the same envelope with the requested signatures appended. */
  sign(req: SignRequest): Promise<string>;
  health(): Promise<{ available: boolean; kind: string }>;
}

/**
 * Dev/testnet signer: signs with the secret keys handed to it in process memory. This is exactly
 * the behaviour StellarProvider had before the seam existed (Keypair.fromSecret(...).sign()), now
 * isolated behind the interface. It REFUSES to sign for a ref with no inline secret, so it can never
 * silently no-op a required signature.
 */
export class LocalDevSigner implements TransactionSigner {
  async sign(req: SignRequest): Promise<string> {
    const tx = TransactionBuilder.fromXDR(req.xdr, req.networkPassphrase);
    for (const ref of req.signers) {
      if (!ref.secretKey) {
        throw new Error(
          `LocalDevSigner has no secret for ${ref.publicKey}: the in-process signer requires inline ` +
            'keys. A key that must be resolved externally needs a real HSM/KMS signer.',
        );
      }
      tx.sign(Keypair.fromSecret(ref.secretKey));
    }
    return tx.toXDR();
  }

  async health(): Promise<{ available: boolean; kind: string }> {
    return { available: true, kind: 'local-dev' };
  }
}

/**
 * Placeholder for a real external signer (KMS/HSM/MPC). It is selected when KEY_MANAGEMENT_PROVIDER
 * is not 'local-dev', but throws until an actual signing endpoint is wired — the "socket" exists so
 * the hardware can be plugged in without touching StellarProvider. Config already fails closed on a
 * non-local-dev provider, so this is unreachable until both the config gate and a real signer land.
 */
export class ExternalSignerNotConfigured implements TransactionSigner {
  constructor(private readonly provider: string) {}

  async sign(): Promise<string> {
    throw new Error(
      `External signer '${this.provider}' is not configured: no HSM/KMS signing endpoint is wired. ` +
        'Provide a TransactionSigner implementation before signing on this key-management provider.',
    );
  }

  async health(): Promise<{ available: boolean; kind: string }> {
    return { available: false, kind: this.provider };
  }
}

/**
 * Chooses the signer for the configured key-management provider. 'local-dev' → in-process signer;
 * anything else → the not-configured placeholder (the user plugs in their HSM/KMS implementation).
 */
export function selectSigner(keyManagementProvider: string): TransactionSigner {
  return keyManagementProvider === 'local-dev'
    ? new LocalDevSigner()
    : new ExternalSignerNotConfigured(keyManagementProvider);
}
