-- Maker-checker on reserve movements (§23).
--
-- Previously ReserveMovement had no status: recordMovement applied the balance change
-- immediately and took `approvedBy` as an unverified caller-supplied string. The reserve is
-- what backs customer tokens, so a single actor could inflate it and label it approved.
--
-- Movements are now created PENDING_APPROVAL and move no money until a *different* principal
-- approves, at which point the balance update and the status transition happen in one
-- transaction.

CREATE TYPE "ReserveMovementStatus" AS ENUM ('PENDING_APPROVAL', 'APPLIED', 'REJECTED');

ALTER TABLE "reserve_movements"
  ADD COLUMN "status"         "ReserveMovementStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
  ADD COLUMN "approvedAt"     TIMESTAMP(3),
  ADD COLUMN "rejectedReason" TEXT,
  ADD COLUMN "balanceAfter"   TEXT;

-- Existing rows were applied to the balance the moment they were written, under the old
-- semantics. Recording them as PENDING_APPROVAL would misrepresent history — the money already
-- moved. They are marked APPLIED, and approvedAt is backfilled from createdAt to reflect that
-- approval was (incorrectly) simultaneous with creation. balanceAfter stays NULL: the balance
-- at the time is not recoverable, and inventing it would be worse than admitting the gap.
UPDATE "reserve_movements" SET "status" = 'APPLIED', "approvedAt" = "createdAt";

CREATE INDEX "reserve_movements_reserveAccountId_status_idx"
  ON "reserve_movements"("reserveAccountId", "status");
