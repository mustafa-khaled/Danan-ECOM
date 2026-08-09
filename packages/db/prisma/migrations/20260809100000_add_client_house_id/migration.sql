-- Add shareable houseId field to Client model for secure transfers
-- houseId is a 6-character alphanumeric identifier that users can share
-- for receiving transfers, without exposing their login credential (houseKey)

-- Step 1: Add nullable column first
ALTER TABLE "Client" ADD COLUMN "houseId" TEXT;

-- Step 2: Generate unique 6-char IDs for existing clients using PL/pgSQL
DO $$
DECLARE
  client_row RECORD;
  new_id TEXT;
  chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  chars_len INT := 30;
  attempts INT;
  max_attempts INT := 100;
BEGIN
  FOR client_row IN SELECT id FROM "Client" WHERE "houseId" IS NULL LOOP
    attempts := 0;
    LOOP
      -- Generate 6-char random ID
      new_id := '';
      FOR i IN 1..6 LOOP
        new_id := new_id || substr(chars, floor(random() * chars_len + 1)::int, 1);
      END LOOP;

      -- Check uniqueness
      IF NOT EXISTS (SELECT 1 FROM "Client" WHERE "houseId" = new_id) THEN
        UPDATE "Client" SET "houseId" = new_id WHERE id = client_row.id;
        EXIT;
      END IF;

      attempts := attempts + 1;
      IF attempts >= max_attempts THEN
        RAISE EXCEPTION 'Could not generate unique houseId after % attempts for client %', max_attempts, client_row.id;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Step 3: Make column required and add unique constraint
ALTER TABLE "Client" ALTER COLUMN "houseId" SET NOT NULL;
CREATE UNIQUE INDEX "Client_houseId_key" ON "Client"("houseId");
