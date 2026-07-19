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

/**
 * The purpose key an event's inner artifact must be signed with. Returns null for events that
 * carry no inner artifact (informational events verified by the envelope alone).
 */
export function purposeForEvent(type: string): TrusteeKeyPurpose | null {
  if (type.startsWith('mint.authorization.')) return 'MINT_AUTHORIZATION';
  if (type.startsWith('reserve.snapshot.')) return 'RESERVE_SNAPSHOT';
  if (type.startsWith('attestation.')) return 'ATTESTATION';
  return null;
}

/** True when the event carries an inner signed artifact PayChain must verify and act on. */
export function isSignedArtifactEvent(body: unknown): body is TrusteeSignedEvent {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  const sig = b.signature as Record<string, unknown> | undefined;
  return typeof b.artifact === 'string' && !!sig && typeof sig.value === 'string' && typeof sig.keyId === 'string';
}
