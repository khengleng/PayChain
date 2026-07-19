-- Trustee-corroborated reserve snapshots: evidence columns (populated only when source='trustee').
ALTER TABLE "reserve_snapshots"
ADD COLUMN "trusteeKeyId" TEXT,
ADD COLUMN "trusteeSignature" TEXT,
ADD COLUMN "trusteeSnapshotId" TEXT;

-- Trustee-signed mint authorizations (§24). One per verified mint.authorization.approved event.
CREATE TABLE "trustee_mint_authorizations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "authorizationId" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "artifact" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'VALID',
    "expiresAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedByMintRequestId" TEXT,

    CONSTRAINT "trustee_mint_authorizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "trustee_mint_authorizations_tenantId_authorizationId_key" ON "trustee_mint_authorizations"("tenantId", "authorizationId");

CREATE INDEX "trustee_mint_authorizations_tenantId_reference_status_idx" ON "trustee_mint_authorizations"("tenantId", "reference", "status");
