-- CreateEnum
-- Spend-for-goods saga states (§25-adjacent). Mirrors the burn tail of RedemptionStatus so
-- ReserveService.getState can subtract confirmed spends the same way it subtracts redemptions.
CREATE TYPE "SpendStatus" AS ENUM ('REQUESTED', 'BURN_PENDING', 'BURN_CONFIRMED', 'COMPLETED', 'FAILED', 'MANUAL_REVIEW');

-- CreateTable
-- A customer spending merchant points on goods: burns supply, frees the reserve that backed the
-- burned points as merchant revenue. No fiat leg; the freed reserve is withdrawn via the existing
-- maker-checker reserve DEBIT.
CREATE TABLE "stablecoin_spends" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "status" "SpendStatus" NOT NULL DEFAULT 'REQUESTED',
    "orderReference" TEXT,
    "burnHash" TEXT,
    "failureReason" TEXT,
    "requestedBy" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "stablecoin_spends_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stablecoin_spends_tenantId_assetId_idx" ON "stablecoin_spends"("tenantId", "assetId");

-- CreateIndex
CREATE INDEX "stablecoin_spends_walletId_assetId_idx" ON "stablecoin_spends"("walletId", "assetId");

-- CreateIndex
CREATE INDEX "stablecoin_spends_status_idx" ON "stablecoin_spends"("status");
