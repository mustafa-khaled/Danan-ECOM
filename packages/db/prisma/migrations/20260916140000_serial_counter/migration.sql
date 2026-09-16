-- Monotonic allocator for human-readable numbering (piece serials, staff request
-- numbers).
--
-- Both were previously derived from `COUNT(*)` on the target table, read outside
-- any lock that covered the subsequent insert. Two concurrent registrations in
-- the same collection therefore computed the same sequence: one won the unique
-- index on `Piece.serialNumber` and the other failed with P2002, and a deleted
-- piece caused a number to be handed out twice. Allocating from this table with
-- `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` takes a row lock for the
-- duration of the caller's transaction, so each value is issued exactly once and
-- is never reused.
CREATE TABLE IF NOT EXISTS "SerialCounter" (
  "scope"        TEXT    NOT NULL,
  "lastSequence" INTEGER NOT NULL DEFAULT 0,
  "updatedAt"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SerialCounter_pkey" PRIMARY KEY ("scope")
);

-- Seed from the existing rows so the first allocation after deploy continues the
-- sequence instead of restarting at 1 and colliding with historical numbers.
-- Serial format: DADAN-<year>-<collectionCode>-<6-digit sequence>.
INSERT INTO "SerialCounter" ("scope", "lastSequence", "updatedAt")
SELECT
  'piece:' || p."collectionId" || ':' || split_part(p."serialNumber", '-', 2),
  MAX((split_part(p."serialNumber", '-', 4))::int),
  now()
FROM "Piece" p
WHERE p."serialNumber" ~ '^DADAN-[0-9]{4}-[A-Z0-9]+-[0-9]+$'
GROUP BY 1
ON CONFLICT ("scope") DO NOTHING;

-- Request number format: REQ-<year>-<3-digit sequence>.
INSERT INTO "SerialCounter" ("scope", "lastSequence", "updatedAt")
SELECT
  'staff-request:' || split_part(s."requestNumber", '-', 2),
  MAX((split_part(s."requestNumber", '-', 3))::int),
  now()
FROM "StaffRequest" s
WHERE s."requestNumber" ~ '^REQ-[0-9]{4}-[0-9]+$'
GROUP BY 1
ON CONFLICT ("scope") DO NOTHING;
