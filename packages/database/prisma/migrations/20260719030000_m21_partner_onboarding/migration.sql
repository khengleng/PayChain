-- Partner self-service onboarding.
CREATE TYPE "PartnerIntegrationType" AS ENUM ('LOYALTY', 'TRUSTEE', 'WHOLESALER', 'RETAILER');
CREATE TYPE "PartnerApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROVISIONED');

CREATE TABLE "partner_applications" (
    "id" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "integrationType" "PartnerIntegrationType" NOT NULL,
    "requestedParentTenantId" TEXT,
    "useCase" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "PartnerApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "tenantId" TEXT,
    "apiClientId" TEXT,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "partner_applications_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "partner_applications_reference_key" ON "partner_applications"("reference");
CREATE INDEX "partner_applications_status_idx" ON "partner_applications"("status");

CREATE TABLE "partner_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "tenantId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "partner_users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "partner_users_email_key" ON "partner_users"("email");
CREATE UNIQUE INDEX "partner_users_applicationId_key" ON "partner_users"("applicationId");
