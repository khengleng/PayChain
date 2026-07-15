-- CreateEnum
CREATE TYPE "AssetClassification" AS ENUM ('LOYALTY_POINT', 'PROMOTIONAL_CREDIT', 'MERCHANT_CREDIT', 'STABLE_VALUE_CREDIT', 'TOKENIZED_DEPOSIT', 'FIAT_BACKED_STABLECOIN', 'ALGORITHMIC_STABLECOIN', 'ASSET_BACKED_TOKEN');

-- CreateEnum
CREATE TYPE "StablecoinLifecycle" AS ENUM ('DRAFT', 'LEGAL_REVIEW', 'COMPLIANCE_REVIEW', 'TREASURY_REVIEW', 'RESERVE_PENDING', 'TECHNICAL_TESTING', 'PILOT_APPROVED', 'ACTIVE', 'MINTING_SUSPENDED', 'REDEMPTION_SUSPENDED', 'FULLY_SUSPENDED', 'WIND_DOWN', 'CLOSED');

-- CreateEnum
CREATE TYPE "StablecoinApprovalGate" AS ENUM ('LEGAL', 'COMPLIANCE', 'TREASURY', 'RESERVE', 'TECHNICAL', 'PILOT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReconciliationCategory" ADD VALUE 'RESERVE_SHORTFALL';
ALTER TYPE "ReconciliationCategory" ADD VALUE 'MISSING_MINT';
ALTER TYPE "ReconciliationCategory" ADD VALUE 'UNMATCHED_BURN';
ALTER TYPE "ReconciliationCategory" ADD VALUE 'UNMATCHED_FIAT_PAYOUT';
ALTER TYPE "ReconciliationCategory" ADD VALUE 'DUPLICATE_PAYOUT';
ALTER TYPE "ReconciliationCategory" ADD VALUE 'STALE_RESERVE_DATA';
ALTER TYPE "ReconciliationCategory" ADD VALUE 'UNAUTHORIZED_MINT';
ALTER TYPE "ReconciliationCategory" ADD VALUE 'LIMIT_BREACH';

-- CreateTable
CREATE TABLE "stablecoin_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "classification" "AssetClassification" NOT NULL,
    "referenceCurrency" TEXT NOT NULL,
    "lifecycleState" "StablecoinLifecycle" NOT NULL DEFAULT 'DRAFT',
    "reserveModel" TEXT,
    "reserveAccountReference" TEXT,
    "reserveRatioTarget" TEXT NOT NULL DEFAULT '1.0',
    "redemptionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mintingModel" TEXT,
    "burningModel" TEXT,
    "issuerLegalEntity" TEXT,
    "regulatedStatus" TEXT,
    "jurisdiction" TEXT,
    "licenseReference" TEXT,
    "attestationRequired" BOOLEAN NOT NULL DEFAULT true,
    "attestationFrequency" TEXT,
    "proofOfReserveEnabled" BOOLEAN NOT NULL DEFAULT false,
    "minimumRedemptionAmount" TEXT,
    "maximumRedemptionAmount" TEXT,
    "redemptionFee" TEXT,
    "mintFee" TEXT,
    "transferFee" TEXT,
    "dailyMintLimit" TEXT,
    "dailyRedeemLimit" TEXT,
    "perWalletHoldingLimit" TEXT,
    "travelRuleRequired" BOOLEAN NOT NULL DEFAULT false,
    "kycLevelRequired" TEXT NOT NULL DEFAULT 'NONE',
    "amlScreeningRequired" BOOLEAN NOT NULL DEFAULT true,
    "sanctionsScreeningRequired" BOOLEAN NOT NULL DEFAULT true,
    "featureFlag" TEXT,
    "activationStatus" TEXT NOT NULL DEFAULT 'INACTIVE',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stablecoin_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stablecoin_approvals" (
    "id" TEXT NOT NULL,
    "stablecoinConfigId" TEXT NOT NULL,
    "gate" "StablecoinApprovalGate" NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "note" TEXT,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stablecoin_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'GLOBAL',
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_stablecoin_policies" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL DEFAULT 'ALL',
    "maxBalance" TEXT,
    "maxDailyReceive" TEXT,
    "maxDailySend" TEXT,
    "maxMonthlyVolume" TEXT,
    "maxTxPerDay" INTEGER,
    "allowedCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "kycLevel" TEXT NOT NULL DEFAULT 'NONE',
    "riskRating" TEXT NOT NULL DEFAULT 'LOW',
    "sanctionsStatus" TEXT NOT NULL DEFAULT 'CLEAR',
    "eddRequired" BOOLEAN NOT NULL DEFAULT false,
    "transferRestricted" BOOLEAN NOT NULL DEFAULT false,
    "frozen" BOOLEAN NOT NULL DEFAULT false,
    "redemptionEligible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_stablecoin_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserve_snapshots" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "reserveBalance" TEXT NOT NULL,
    "outstandingSupply" TEXT NOT NULL,
    "reserveRatio" TEXT NOT NULL,
    "unredeemedLiability" TEXT,
    "pendingMintLiability" TEXT,
    "pendingRedemptionLiability" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "snapshotHash" TEXT,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reserve_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attestations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "reserveRatio" TEXT,
    "auditorReference" TEXT,
    "documentHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "effectiveAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "onChainAnchorTx" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attestations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stablecoin_configs_assetId_key" ON "stablecoin_configs"("assetId");

-- CreateIndex
CREATE INDEX "stablecoin_configs_tenantId_idx" ON "stablecoin_configs"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "stablecoin_approvals_stablecoinConfigId_gate_key" ON "stablecoin_approvals"("stablecoinConfigId", "gate");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_tenantId_key_key" ON "feature_flags"("tenantId", "key");

-- CreateIndex
CREATE INDEX "wallet_stablecoin_policies_tenantId_idx" ON "wallet_stablecoin_policies"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_stablecoin_policies_walletId_assetId_key" ON "wallet_stablecoin_policies"("walletId", "assetId");

-- CreateIndex
CREATE INDEX "reserve_snapshots_tenantId_assetId_idx" ON "reserve_snapshots"("tenantId", "assetId");

-- CreateIndex
CREATE INDEX "attestations_tenantId_assetId_idx" ON "attestations"("tenantId", "assetId");

-- AddForeignKey
ALTER TABLE "stablecoin_configs" ADD CONSTRAINT "stablecoin_configs_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stablecoin_approvals" ADD CONSTRAINT "stablecoin_approvals_stablecoinConfigId_fkey" FOREIGN KEY ("stablecoinConfigId") REFERENCES "stablecoin_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
