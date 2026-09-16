-- Aligns five foreign keys with the delete behaviour schema.prisma declares.
--
-- Found by the new drift check: these were created with `NO ACTION` while the
-- schema asks for `RESTRICT` (required relations) and `SET NULL` (optional ones).
--
-- For the required relations the two are equivalent in practice, and this only
-- removes noise from the drift check. The two `SET NULL` cases are a real
-- behaviour change: deleting a `Collection` that has staff requests, or an
-- `AdminUser` who reviewed one, currently fails with a constraint violation even
-- though the columns are nullable and the code treats them as optional.
ALTER TABLE "Client"
  DROP CONSTRAINT "Client_classId_fkey",
  ADD CONSTRAINT "Client_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "Class"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Piece"
  DROP CONSTRAINT "Piece_collectionId_fkey",
  ADD CONSTRAINT "Piece_collectionId_fkey"
    FOREIGN KEY ("collectionId") REFERENCES "Collection"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StaffRequest"
  DROP CONSTRAINT "StaffRequest_clientId_fkey",
  ADD CONSTRAINT "StaffRequest_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StaffRequest"
  DROP CONSTRAINT "StaffRequest_collectionId_fkey",
  ADD CONSTRAINT "StaffRequest_collectionId_fkey"
    FOREIGN KEY ("collectionId") REFERENCES "Collection"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StaffRequest"
  DROP CONSTRAINT "StaffRequest_reviewedById_fkey",
  ADD CONSTRAINT "StaffRequest_reviewedById_fkey"
    FOREIGN KEY ("reviewedById") REFERENCES "AdminUser"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
