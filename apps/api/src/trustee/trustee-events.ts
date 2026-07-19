/**
 * The trustee → PayChain event contract (see docs/integration/trustee-events-contract.md).
 *
 * Every event body is already Ed25519-signed as a whole with the trustee's WEBHOOK key (the
 * envelope). Events that authorize or attest something additionally carry an INNER signed
 * artifact, signed by a purpose-specific key published in the trustee JWKS — so a compromised
 * webhook transport key cannot forge a mint authorization or a reserve snapshot.
 */

/** Purposes as published in the trustee JWKS `purpose` field. */
export type TrusteeKeyPurpose =
  | 'WEBHOOK'
  | 'MINT_AUTHORIZATION'
  | 'RESERVE_SNAPSHOT'
  | 'ATTESTATION'
  | 'REQUEST_SIGNING'
  | 'RESPONSE_SIGNING'
  | 'API_AUTH';

export const TrusteeEventType = {
  MINT_AUTHORIZATION_APPROVED: 'mint.authorization.approved',
  RESERVE_SNAPSHOT_CREATED: 'reserve.snapshot.created',
  ATTESTATION_PUBLISHED: 'attestation.published',
  DEPOSIT_CLEARED: 'deposit.cleared',
} as const;

/** The inner signature block carried by artifact-bearing events. */
export interface TrusteeSignatureBlock {
  keyId: string;
  alg: 'ed25519';
  value: string;
}

/** An event body that carries an inner signed artifact (a string, signed verbatim). */
export interface TrusteeSignedEvent {
  type: string;
  id?: string;
  occurredAt?: string;
  /** The exact JSON string the trustee signed with the purpose key. Verified, then JSON.parsed. */
  artifact: string;
  signature: TrusteeSignatureBlock;
}

export interface MintAuthorizationArtifact {
  authorizationId: string;
  /** The PayChain StablecoinMintRequest.id this authorization is for. */
  reference: string;
  tenantId: string;
  assetId: string;
  amount: string;
  destination: string;
  expiresAt?: string;
}

export interface ReserveSnapshotArtifact {
  snapshotId: string;
  tenantId: string;
  assetId: string;
  reserveBalance: string;
  currency?: string;
  asOf?: string;
}

export interface DepositClearedArtifact {
  depositId: string;
  tenantId: string;
  /** Matches the mint's fundingReference — how a cleared deposit funds a specific mint. */
  reference: string;
  amount: string;
  currency?: string;
  clearedAt?: string;
}

/**
 * The purpose key an event's inner artifact must be signed with. Returns null for events that
 * carry no inner artifact (informational events verified by the envelope alone). Deposits are
 * signed with the reserve-snapshot key (funding is a reserve-domain concern; the trustee may
 * publish a dedicated funding key later).
 */
export function purposeForEvent(type: string): TrusteeKeyPurpose | null {
  if (type.startsWith('mint.authorization.')) return 'MINT_AUTHORIZATION';
  if (type.startsWith('reserve.snapshot.')) return 'RESERVE_SNAPSHOT';
  if (type === 'deposit.cleared') return 'RESERVE_SNAPSHOT';
  if (type.startsWith('attestation.')) return 'ATTESTATION';
  return null;
}

/** Review hardening: require the string fields an artifact needs so a malformed one 400s (not 500). */
export function requireStringFields(
  obj: unknown,
  fields: string[],
): Record<string, string> {
  if (!obj || typeof obj !== 'object') throw new Error('artifact is not an object');
  const rec = obj as Record<string, unknown>;
  for (const f of fields) {
    if (typeof rec[f] !== 'string' || (rec[f] as string).length === 0) {
      throw new Error(`artifact is missing required field: ${f}`);
    }
  }
  return rec as Record<string, string>;
}

/** Parse an optional ISO-8601 date field; reject an invalid one rather than storing NaN. */
export function parseOptionalDate(value: unknown): Date | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') throw new Error('date field must be a string');
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error('date field is not a valid ISO-8601 date');
  return d;
}

/** True when the event carries an inner signed artifact PayChain must verify and act on. */
export function isSignedArtifactEvent(body: unknown): body is TrusteeSignedEvent {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  const sig = b.signature as Record<string, unknown> | undefined;
  return typeof b.artifact === 'string' && !!sig && typeof sig.value === 'string' && typeof sig.keyId === 'string';
}
