-- Accountable owner for an API credential (§30, §34).
--
-- Maker-checker on treasury movements was unenforceable across namespaces: a movement's
-- createdBy is an API clientId while an approving admin is an email, so the equality check in
-- adminApprove could never match and never fired. One person holding both an API credential and
-- portal access could create and execute a treasury movement with no code resistance — the
-- service comment conceded this, asserting separation held "by construction".
--
-- Recording who is accountable for a credential gives the check something real to compare.
ALTER TABLE "api_clients" ADD COLUMN "ownerEmail" TEXT;

CREATE INDEX "api_clients_ownerEmail_idx" ON "api_clients"("ownerEmail");
