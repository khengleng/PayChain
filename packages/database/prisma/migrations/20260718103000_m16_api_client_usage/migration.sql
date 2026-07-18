ALTER TABLE "api_clients"
  ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "lastTokenIssuedAt" TIMESTAMP(3),
  ADD COLUMN "lastApiRequestAt" TIMESTAMP(3);

CREATE TABLE "api_client_request_logs" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "apiClientId" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "route" TEXT NOT NULL,
  "statusCode" INTEGER NOT NULL,
  "ip" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "api_client_request_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "api_client_request_logs_apiClientId_createdAt_idx"
  ON "api_client_request_logs"("apiClientId", "createdAt");

CREATE INDEX "api_client_request_logs_tenantId_createdAt_idx"
  ON "api_client_request_logs"("tenantId", "createdAt");

ALTER TABLE "api_client_request_logs"
  ADD CONSTRAINT "api_client_request_logs_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "api_client_request_logs"
  ADD CONSTRAINT "api_client_request_logs_apiClientId_fkey"
  FOREIGN KEY ("apiClientId") REFERENCES "api_clients"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
