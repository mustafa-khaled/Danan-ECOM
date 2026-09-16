-- `AdminUser.mustChangePassword` was added to schema.prisma without a
-- corresponding migration, so `prisma migrate deploy` produced a database the
-- Prisma client could not query: every admin login and the seed itself failed
-- with P2022 (column does not exist).
--
-- Defaults to true to match the schema: an admin account created by another
-- admin, or by the seed, must rotate its password before it can be used.
ALTER TABLE "AdminUser"
  ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;
