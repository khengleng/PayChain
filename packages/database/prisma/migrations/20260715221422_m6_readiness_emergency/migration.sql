-- CreateEnum
CREATE TYPE "ReadinessStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'BLOCKED', 'WAIVED');

-- CreateEnum
CREATE TYPE "EmergencyActionType" AS ENUM ('SUSPEND_MINTING', 'SUSPEND_REDEMPTION', 'SUSPEND_CONVERSION', 'SUSPEND_TRANSFERS', 'FREEZE_WALLET', 'FREEZE_ASSET', 'DISABLE_TENANT', 'DISABLE_MAINNET_WRITES', 'RESUME');

-- CreateTable
CREATE TABLE "readiness_gates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mandatory" BOOLEAN NOT NULL DEFAULT true,
    "status" "ReadinessStatus" NOT NULL DEFAULT 'PENDING',
    "evidence" TEXT,
    "owner" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "readiness_gates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_control_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "action" "EmergencyActionType" NOT NULL,
    "scope" TEXT,
    "reason" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_control_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "readiness_gates_key_key" ON "readiness_gates"("key");

-- CreateIndex
CREATE INDEX "readiness_gates_category_idx" ON "readiness_gates"("category");

-- CreateIndex
CREATE INDEX "emergency_control_events_action_idx" ON "emergency_control_events"("action");
