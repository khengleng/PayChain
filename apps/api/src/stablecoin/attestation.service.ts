import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Attestation } from '@paychain/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthContext } from '../auth/auth-context';

export interface PublishAttestationInput {
  assetId: string;
  /** Stable name for the attestation series, e.g. "Q3-2026 reserve attestation". */
  identifier: string;
  /** SHA-256 of the auditor's signed document. Never the document. */
  documentHash: string;
  auditorReference: string;
  /** The snapshot these figures were taken from. */
  reserveSnapshotId: string;
  effectiveAt: Date;
  expiresAt?: Date;
}

const SHA256_HEX = /^[0-9a-f]{64}$/i;

/**
 * Proof-of-reserve attestations (§24).
 *
 * The Attestation model existed from the start with zero code touching it — no service, no
 * controller, no writer. Meanwhile the admin console advertised "proof-of-reserve". §24's ten
 * requirements were nine-tenths unbuilt, which mattered because proof-of-reserve is the first
 * thing a regulator asks about when reserves are self-asserted.
 *
 * What this is, precisely:
 *
 * - PayChain stores METADATA AND A HASH. The auditor's document never enters the system. That
 *   satisfies §24's "public metadata, private evidence" separation and makes "never place
 *   confidential bank documents on-chain" true by construction rather than by policy.
 * - An attestation pins the reserve SNAPSHOT it refers to, and denormalises that snapshot's hash,
 *   so it stands alone: anyone holding the figures can recompute the hash and confirm this
 *   attestation is about those exact numbers.
 * - Versioning is per identifier. Publishing a new version SUPERSEDES the old one rather than
 *   editing it — an attestation is a statement someone made at a time, and rewriting history is
 *   the one thing an attestation must not permit.
 *
 * What this is NOT, and must not be presented as:
 *
 * - It is not proof of solvency. It records that a named auditor signed a document with a given
 *   hash. If the auditor is wrong, or the document says something else, PayChain cannot tell.
 * - On-chain anchoring is deliberately unimplemented. §0.6: anchoring proves a hash existed at a
 *   time, NOT that reserves were sufficient — and it would need the issuer key, which is
 *   dev-grade while the key_management gate is BLOCKED.
 */
@Injectable()
export class AttestationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Records an external attestation, superseding any prior version of the same identifier.
   */
  async publish(
    auth: AuthContext,
    input: PublishAttestationInput,
    correlationId: string,
  ): Promise<Attestation> {
    // A hash, not a document. If a caller sends anything that is not a bare digest they are
    // trying to store evidence here, and evidence belongs with the auditor.
    if (!SHA256_HEX.test(input.documentHash)) {
      throw new BadRequestException(
        'documentHash must be a SHA-256 hex digest of the signed document. PayChain stores the ' +
          'hash and never the document itself (§24).',
      );
    }
    if (input.expiresAt && input.expiresAt <= input.effectiveAt) {
      throw new BadRequestException('expiresAt must be after effectiveAt');
    }

    const snapshot = await this.prisma.reserveSnapshot.findUnique({
      where: { id: input.reserveSnapshotId },
    });
    if (!snapshot || snapshot.tenantId !== auth.tenantId || snapshot.assetId !== input.assetId) {
      throw new NotFoundException('Reserve snapshot not found for this asset');
    }
    if (!snapshot.snapshotHash) {
      // An unhashed snapshot cannot be attested to: there is nothing to bind the claim to.
      throw new BadRequestException('That reserve snapshot has no hash and cannot be attested to');
    }

    const prior = await this.prisma.attestation.findFirst({
      where: { tenantId: auth.tenantId, assetId: input.assetId, identifier: input.identifier },
      orderBy: { version: 'desc' },
    });

    const attestation = await this.prisma.$transaction(async (tx) => {
      if (prior) {
        // Supersede, never edit. The prior statement stays exactly as it was made.
        await tx.attestation.update({ where: { id: prior.id }, data: { status: 'SUPERSEDED' } });
      }
      return tx.attestation.create({
        data: {
          tenantId: auth.tenantId,
          assetId: input.assetId,
          identifier: input.identifier,
          version: (prior?.version ?? 0) + 1,
          reserveRatio: snapshot.reserveRatio,
          auditorReference: input.auditorReference,
          documentHash: input.documentHash.toLowerCase(),
          status: 'ACTIVE',
          effectiveAt: input.effectiveAt,
          expiresAt: input.expiresAt,
          reserveSnapshotId: snapshot.id,
          snapshotHash: snapshot.snapshotHash,
        },
      });
    });

    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'attestation.published',
      resourceType: 'attestation',
      resourceId: attestation.id,
      correlationId,
      metadata: {
        identifier: input.identifier,
        version: attestation.version,
        supersededVersion: prior?.version ?? null,
        auditorReference: input.auditorReference,
        documentHash: attestation.documentHash,
        snapshotHash: snapshot.snapshotHash,
        reserveRatio: snapshot.reserveRatio,
      },
    });

    return attestation;
  }

  /**
   * The attestation currently in force for an asset, or null.
   *
   * Expiry is evaluated on read rather than by a sweep: an attestation does not become stale
   * because a job noticed, and a caller must never see an expired one as current merely because
   * nothing has run yet.
   */
  async current(tenantId: string, assetId: string, now = new Date()): Promise<Attestation | null> {
    const active = await this.prisma.attestation.findFirst({
      where: {
        tenantId,
        assetId,
        status: 'ACTIVE',
        effectiveAt: { lte: now },
      },
      orderBy: { version: 'desc' },
    });
    if (!active) return null;
    if (active.expiresAt && active.expiresAt <= now) return null;
    return active;
  }

  async list(tenantId: string, assetId: string): Promise<Attestation[]> {
    return this.prisma.attestation.findMany({
      where: { tenantId, assetId },
      orderBy: [{ identifier: 'asc' }, { version: 'desc' }],
    });
  }
}
