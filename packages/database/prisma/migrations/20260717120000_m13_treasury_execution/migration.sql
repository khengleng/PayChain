-- Treasury execution evidence (§30).
--
-- approve() set status EXECUTED and stamped executedAt while moving nothing: fromAccount and
-- toAccount are free-text, there is no ledger posting, no chain op, and no reserve link. The
-- record asserted a settlement that had not happened, and skipped the APPROVED state that
-- already existed in the enum.
--
-- PayChain has no bank rails and cannot move fiat. So the two acts are separated: APPROVED means
-- authorised, EXECUTED means an operator recorded that the funds actually moved and referenced
-- the proof. These columns carry that evidence.
ALTER TABLE "treasury_movements"
  ADD COLUMN "approvedAt"        TIMESTAMP(3),
  ADD COLUMN "executedBy"        TEXT,
  ADD COLUMN "externalReference" TEXT,
  ADD COLUMN "rejectedReason"    TEXT;

-- Existing rows were marked EXECUTED by the old approve(), which proved nothing about settlement.
-- They are moved back to APPROVED rather than left asserting an execution that was never
-- evidenced: approval genuinely happened, settlement was never established. executedAt is cleared
-- for the same reason — a timestamp for an event that did not occur is worse than a null.
UPDATE "treasury_movements"
   SET "status" = 'APPROVED',
       "approvedAt" = "executedAt",
       "executedAt" = NULL
 WHERE "status" = 'EXECUTED' AND "externalReference" IS NULL;
