-- CreateEnum
-- Cross-peg exchange saga states. The source coin is reserve-backed, so its burn reduces the
-- source coin's tracked supply (getState subtracts SOURCE_BURNED/DEST_MINT_PENDING/COMPLETED).
CREATE TYPE "ExchangeStatus" AS ENUM ('QUOTED', 'CONFIRMED', 'SOURCE_BURN_PENDING', 'SOURCE_BURNED', 'DEST_MINT_PENDING', 'COMPLETED', 'FAILED', 'COMPENSATING', 'COMPENSATED');

-- CreateTable
-- A same-holder swap of one reserve-backed coin for another: burn the source (freeing its reserve),
-- mint the destination (gated by the destination's own reserve). No cross-currency reserve move.
CREATE TABLE "stablecoin_exchanges" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fromAssetId" TEXT NOT NULL,
    "toAssetId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "fromAmount" TEXT NOT NULL,
    "toAmount" TEXT NOT NULL,
    "fxRate" TEXT NOT NULL,
    "spread" TEXT NOT NULL DEFAULT '0',
    "fee" TEXT NOT NULL DEFAULT '0',
    "status" "ExchangeStatus" NOT NULL DEFAULT 'QUOTED',
    "quoteExpiresAt" TIMESTAMP(3) NOT NULL,
    "sourceBurnHash" TEXT,
    "mintRequestId" TEXT,
    "failureReason" TEXT,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "stablecoin_exchanges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stablecoin_exchanges_tenantId_idx" ON "stablecoin_exchanges"("tenantId");

-- CreateIndex
CREATE INDEX "stablecoin_exchanges_fromAssetId_status_idx" ON "stablecoin_exchanges"("fromAssetId", "status");

-- CreateIndex
CREATE INDEX "stablecoin_exchanges_walletId_fromAssetId_idx" ON "stablecoin_exchanges"("walletId", "fromAssetId");

-- CreateIndex
CREATE INDEX "stablecoin_exchanges_status_idx" ON "stablecoin_exchanges"("status");
