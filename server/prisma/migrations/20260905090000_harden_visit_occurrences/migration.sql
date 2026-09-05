-- Normalize existing visit dates to a calendar-day key before enforcing one
-- occurrence per job/day. When legacy data contains duplicates, retain the
-- most recently updated occurrence so completed/skipped work is not lost.
ALTER TABLE "Visit" ADD COLUMN "scheduledDateKey" TEXT;

UPDATE "Visit"
SET "scheduledDateKey" = to_char("scheduledDate" AT TIME ZONE 'UTC', 'YYYY-MM-DD');

DELETE FROM "Visit" older
USING "Visit" newer
WHERE older."jobId" = newer."jobId"
  AND older."scheduledDateKey" = newer."scheduledDateKey"
  AND (older."updatedAt" < newer."updatedAt"
    OR (older."updatedAt" = newer."updatedAt" AND older."id" < newer."id"));

ALTER TABLE "Visit" ALTER COLUMN "scheduledDateKey" SET NOT NULL;

CREATE UNIQUE INDEX "Visit_jobId_scheduledDateKey_key"
  ON "Visit"("jobId", "scheduledDateKey");