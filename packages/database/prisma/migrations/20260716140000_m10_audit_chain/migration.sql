-- Tamper-evident, append-only audit trail (§41).
--
-- Before this migration, "append-only" was a comment in the service layer: the application role
-- could UPDATE or DELETE audit_logs freely. Two independent controls now replace that promise.
--
--  1. Database triggers reject mutation of sealed rows and reject TRUNCATE. This *prevents*
--     tampering through the application's connection.
--  2. A hash chain (seq / prevHash / entryHash, written by packages/database/src/audit-chain.ts)
--     makes tampering *detectable* even by someone with DDL rights who drops the triggers,
--     provided any earlier hash was observed or exported.
--
-- Neither alone is sufficient: (1) can be dropped by a superuser, and (2) cannot stop a write.
-- Together they mean a silent, undetectable edit requires both DDL rights and control of every
-- previously exported hash.

ALTER TABLE "audit_logs"
  ADD COLUMN "seq"       BIGINT,
  ADD COLUMN "prevHash"  TEXT,
  ADD COLUMN "entryHash" TEXT;

CREATE UNIQUE INDEX "audit_logs_seq_key"       ON "audit_logs"("seq");
CREATE UNIQUE INDEX "audit_logs_entryHash_key" ON "audit_logs"("entryHash");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE INDEX "audit_logs_actor_idx"     ON "audit_logs"("actor");
CREATE INDEX "audit_logs_action_idx"    ON "audit_logs"("action");

-- Rows written before this migration have no entryHash. They are deliberately left mutable so
-- the one-time backfill can seal them; once entryHash is set, the trigger below locks them
-- forever. verifyAuditChain() reports any still-unsealed rows as unchained legacy rather than
-- pretending they are protected.
CREATE OR REPLACE FUNCTION audit_logs_append_only() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'audit_logs is append-only: DELETE denied (id=%, seq=%)', OLD."id", OLD."seq"
      USING ERRCODE = 'restrict_violation';
  END IF;

  IF OLD."entryHash" IS NOT NULL THEN
    RAISE EXCEPTION 'audit_logs is append-only: UPDATE denied on sealed row (id=%, seq=%)', OLD."id", OLD."seq"
      USING ERRCODE = 'restrict_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_append_only
  BEFORE UPDATE OR DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION audit_logs_append_only();

CREATE OR REPLACE FUNCTION audit_logs_no_truncate() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only: TRUNCATE denied'
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_no_truncate
  BEFORE TRUNCATE ON "audit_logs"
  FOR EACH STATEMENT EXECUTE FUNCTION audit_logs_no_truncate();
