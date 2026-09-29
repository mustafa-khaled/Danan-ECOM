-- The collection access roster looks up open ACCESS_REQUESTs for a single
-- collection. The existing ("type","status") and ("clientId") indexes do not
-- cover a collection-scoped lookup.
CREATE INDEX "StaffRequest_collectionId_type_status_idx"
ON "StaffRequest" ("collectionId", "type", "status");
