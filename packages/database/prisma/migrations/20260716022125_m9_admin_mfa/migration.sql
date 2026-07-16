-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN     "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mfaSecretEnc" TEXT;
