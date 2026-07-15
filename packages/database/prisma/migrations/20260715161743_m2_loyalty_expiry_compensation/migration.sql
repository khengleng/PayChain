-- CreateEnum
CREATE TYPE "ExpiryPolicy" AS ENUM ('NONE', 'FIXED', 'ROLLING');

-- CreateEnum
CREATE TYPE "PointsLotStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CONSUMED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionStatus" ADD VALUE 'APPROVAL_REQUIRED';
ALTER TYPE "TransactionStatus" ADD VALUE 'APPROVED';
ALTER TYPE "TransactionStatus" ADD VALUE 'REVERSED_BY_COMPENSATION';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'ASSET_EXPIRED';
ALTER TYPE "TransactionType" ADD VALUE 'COMPENSATING_TRANSACTION';

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "expiryDays" INTEGER,
ADD COLUMN     "expiryPolicy" "ExpiryPolicy" NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "compensatesTransactionId" TEXT,
ADD COLUMN     "createdBy" TEXT;

-- CreateTable
CREATE TABLE "points_lots" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "remaining" TEXT NOT NULL,
    "status" "PointsLotStatus" NOT NULL DEFAULT 'ACTIVE',
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_lots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "points_lots_tenantId_idx" ON "points_lots"("tenantId");

-- CreateIndex
CREATE INDEX "points_lots_status_expiresAt_idx" ON "points_lots"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "points_lots_walletId_assetId_idx" ON "points_lots"("walletId", "assetId");

-- AddForeignKey
ALTER TABLE "points_lots" ADD CONSTRAINT "points_lots_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
