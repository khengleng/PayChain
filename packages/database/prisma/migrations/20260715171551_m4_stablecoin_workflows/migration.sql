-- CreateEnum
CREATE TYPE "ReserveAccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "MintStatus" AS ENUM ('REQUESTED', 'RESERVE_PENDING', 'RESERVE_CONFIRMED', 'COMPLIANCE_REVIEW', 'APPROVAL_REQUIRED', 'APPROVED', 'SIGNING', 'SUBMITTED', 'CONFIRMED', 'RECONCILED', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('REQUESTED', 'VALIDATING', 'COMPLIANCE_REVIEW', 'APPROVAL_REQUIRED', 'APPROVED', 'ESCROW_HELD', 'BURN_PENDING', 'BURN_CONFIRMED', 'FIAT_PAYOUT_PENDING', 'FIAT_PAYOUT_CONFIRMED', 'COMPLETED', 'REJECTED', 'FAILED', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "ConversionStatus" AS ENUM ('QUOTED', 'CONFIRMED', 'POINTS_BURN_PENDING', 'POINTS_BURNED', 'STABLECOIN_MINT_PENDING', 'COMPLETED', 'FAILED', 'COMPENSATING', 'COMPENSATED');

-- CreateEnum
CREATE TYPE "TreasuryMovementStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXECUTED', 'FAILED');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'HELD', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "reserve_accounts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "custodianReference" TEXT,
    "bankReference" TEXT,
    "balance" TEXT NOT NULL DEFAULT '0',
    "status" "ReserveAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reserve_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserve_movements" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reserveAccountId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "reference" TEXT,
    "createdBy" TEXT,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reserve_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stablecoin_mint_requests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "destinationWalletId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "status" "MintStatus" NOT NULL DEFAULT 'REQUESTED',
    "fundingReference" TEXT,
    "reserveConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "complianceResult" TEXT,
    "approvedBy" TEXT,
    "requestedBy" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "blockchainHash" TEXT,
    "reconciliationStatus" TEXT,
    "failureReason" TEXT,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stablecoin_mint_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stablecoin_redemptions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'REQUESTED',
    "kycValidated" BOOLEAN NOT NULL DEFAULT false,
    "amlResult" TEXT,
    "sanctionsResult" TEXT,
    "bankAccountReference" TEXT,
    "approvedBy" TEXT,
    "requestedBy" TEXT NOT NULL,
    "burnHash" TEXT,
    "payoutReference" TEXT,
    "failureReason" TEXT,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stablecoin_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stablecoin_conversions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fromAssetId" TEXT NOT NULL,
    "toAssetId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "pointsAmount" TEXT NOT NULL,
    "stablecoinAmount" TEXT NOT NULL,
    "rate" TEXT NOT NULL,
    "spread" TEXT NOT NULL DEFAULT '0',
    "fee" TEXT NOT NULL DEFAULT '0',
    "status" "ConversionStatus" NOT NULL DEFAULT 'QUOTED',
    "quoteExpiresAt" TIMESTAMP(3) NOT NULL,
    "pointsBurnHash" TEXT,
    "mintRequestId" TEXT,
    "failureReason" TEXT,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stablecoin_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treasury_movements" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assetId" TEXT,
    "fromAccount" TEXT NOT NULL,
    "toAccount" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" "TreasuryMovementStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "executedAt" TIMESTAMP(3),
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treasury_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_alerts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "subjectType" TEXT NOT NULL,
    "subjectReference" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "holdApplied" BOOLEAN NOT NULL DEFAULT false,
    "detail" JSONB,
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "monitoring_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reserve_accounts_tenantId_assetId_idx" ON "reserve_accounts"("tenantId", "assetId");

-- CreateIndex
CREATE INDEX "reserve_movements_tenantId_idx" ON "reserve_movements"("tenantId");

-- CreateIndex
CREATE INDEX "stablecoin_mint_requests_tenantId_assetId_idx" ON "stablecoin_mint_requests"("tenantId", "assetId");

-- CreateIndex
CREATE INDEX "stablecoin_mint_requests_status_idx" ON "stablecoin_mint_requests"("status");

-- CreateIndex
CREATE INDEX "stablecoin_redemptions_tenantId_assetId_idx" ON "stablecoin_redemptions"("tenantId", "assetId");

-- CreateIndex
CREATE INDEX "stablecoin_redemptions_status_idx" ON "stablecoin_redemptions"("status");

-- CreateIndex
CREATE INDEX "stablecoin_conversions_tenantId_idx" ON "stablecoin_conversions"("tenantId");

-- CreateIndex
CREATE INDEX "stablecoin_conversions_status_idx" ON "stablecoin_conversions"("status");

-- CreateIndex
CREATE INDEX "treasury_movements_tenantId_idx" ON "treasury_movements"("tenantId");

-- CreateIndex
CREATE INDEX "treasury_movements_status_idx" ON "treasury_movements"("status");

-- CreateIndex
CREATE INDEX "monitoring_alerts_tenantId_idx" ON "monitoring_alerts"("tenantId");

-- CreateIndex
CREATE INDEX "monitoring_alerts_severity_status_idx" ON "monitoring_alerts"("severity", "status");

-- AddForeignKey
ALTER TABLE "reserve_movements" ADD CONSTRAINT "reserve_movements_reserveAccountId_fkey" FOREIGN KEY ("reserveAccountId") REFERENCES "reserve_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
