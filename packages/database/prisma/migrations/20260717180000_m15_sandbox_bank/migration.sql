-- M15: sandbox bank (mock Bakong). Additive only (§0.4).
CREATE TABLE "sandbox_bank_accounts" (
  "id"            TEXT NOT NULL,
  "accountNumber" TEXT NOT NULL,
  "accountName"   TEXT NOT NULL,
  "currency"      TEXT NOT NULL DEFAULT 'KHR',
  "balance"       TEXT NOT NULL DEFAULT '0',
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sandbox_bank_accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sandbox_bank_accounts_accountNumber_key" ON "sandbox_bank_accounts"("accountNumber");
