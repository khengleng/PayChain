ALTER TABLE "api_clients"
  ADD COLUMN "requestsPerMinuteLimit" INTEGER NOT NULL DEFAULT 120,
  ADD COLUMN "writeRequestsPerMinuteLimit" INTEGER NOT NULL DEFAULT 30;

CREATE TABLE "api_client_auth_attempts" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "apiClientId" TEXT,
  "clientIdValue" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL,
  "failureReason" TEXT,
  "ip" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "api_client_auth_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "api_client_auth_attempts_apiClientId_createdAt_idx"
  ON "api_client_auth_attempts"("apiClientId", "createdAt");

CREATE INDEX "api_client_auth_attempts_tenantId_createdAt_idx"
  ON "api_client_auth_attempts"("tenantId", "createdAt");

CREATE INDEX "api_client_auth_attempts_clientIdValue_createdAt_idx"
  ON "api_client_auth_attempts"("clientIdValue", "createdAt");

ALTER TABLE "api_client_auth_attempts"
  ADD CONSTRAINT "api_client_auth_attempts_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "api_client_auth_attempts"
  ADD CONSTRAINT "api_client_auth_attempts_apiClientId_fkey"
  FOREIGN KEY ("apiClientId") REFERENCES "api_clients"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
