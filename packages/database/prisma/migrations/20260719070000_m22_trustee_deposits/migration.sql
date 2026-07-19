-- Trustee-verified cleared deposits (funding confirmation source).
CREATE TABLE "trustee_deposits" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "depositId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CLEARED',
    "keyId" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "artifact" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trustee_deposits_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "trustee_deposits_tenantId_depositId_key" ON "trustee_deposits"("tenantId", "depositId");
CREATE INDEX "trustee_deposits_tenantId_reference_status_idx" ON "trustee_deposits"("tenantId", "reference", "status");
