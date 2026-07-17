-- Link an attestation to the reserve snapshot it attests to (§24).
--
-- Attestation recorded a bare reserveRatio with no reference to WHICH figures produced it — a
-- claim about nothing in particular. Pinning the snapshot, and denormalising its hash, makes the
-- attestation stand alone as evidence: anyone can recompute the snapshot hash and confirm the
-- attestation refers to those exact figures.
ALTER TABLE "attestations"
  ADD COLUMN "reserveSnapshotId" TEXT,
  ADD COLUMN "snapshotHash"      TEXT;

CREATE INDEX "attestations_assetId_status_idx" ON "attestations"("assetId", "status");
