ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'WHOLESALE_ADMIN';

CREATE TYPE "TenantType" AS ENUM ('DIRECT', 'WHOLESALER', 'RETAILER');

ALTER TABLE "tenants"
ADD COLUMN "type" "TenantType" NOT NULL DEFAULT 'DIRECT',
ADD COLUMN "parentTenantId" TEXT;

ALTER TABLE "tenants"
ADD CONSTRAINT "tenants_parentTenantId_fkey"
FOREIGN KEY ("parentTenantId") REFERENCES "tenants"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "tenants_parentTenantId_idx" ON "tenants"("parentTenantId");
