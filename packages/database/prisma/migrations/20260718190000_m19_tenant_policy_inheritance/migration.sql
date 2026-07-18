ALTER TABLE "tenants"
ADD COLUMN "apiClientDefaultRequestsPerMinuteLimit" INTEGER,
ADD COLUMN "apiClientDefaultWriteRequestsPerMinuteLimit" INTEGER;
