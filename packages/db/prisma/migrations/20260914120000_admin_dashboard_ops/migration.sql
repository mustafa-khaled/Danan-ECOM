-- Admin dashboard: roles, story fields, house settings, staff requests, indexes.

ALTER TYPE "AdminRole" ADD VALUE 'CURATOR';
ALTER TYPE "AdminRole" ADD VALUE 'OPERATIONS';

CREATE TYPE "StaffRequestType" AS ENUM ('ACCESS_REQUEST', 'MEMBERSHIP_UPGRADE', 'KEY_ISSUANCE');
CREATE TYPE "StaffRequestStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'COMPLETED', 'REJECTED');

ALTER TABLE "Client" ADD COLUMN "lastSeenAt" TIMESTAMP(3);
CREATE INDEX "Client_isActive_classId_idx" ON "Client"("isActive", "classId");
CREATE INDEX "Client_createdAt_idx" ON "Client"("createdAt" DESC);
CREATE INDEX "Client_lastSeenAt_idx" ON "Client"("lastSeenAt");

ALTER TABLE "Collection" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Collection" ADD COLUMN "origin" TEXT;
ALTER TABLE "Collection" ADD COLUMN "originAr" TEXT;
ALTER TABLE "Collection" ADD COLUMN "meaning" TEXT;
ALTER TABLE "Collection" ADD COLUMN "meaningAr" TEXT;
ALTER TABLE "Collection" ADD COLUMN "inspiration" TEXT;
ALTER TABLE "Collection" ADD COLUMN "inspirationAr" TEXT;
ALTER TABLE "Collection" ADD COLUMN "storyContent" TEXT;
ALTER TABLE "Collection" ADD COLUMN "storyContentAr" TEXT;
ALTER TABLE "Collection" ADD COLUMN "storyImageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
CREATE INDEX "Collection_isVisible_sortOrder_idx" ON "Collection"("isVisible", "sortOrder");
CREATE INDEX "Collection_updatedAt_idx" ON "Collection"("updatedAt");

CREATE INDEX "Piece_status_createdAt_idx" ON "Piece"("status", "createdAt");
CREATE INDEX "Piece_isActive_collectionId_idx" ON "Piece"("isActive", "collectionId");
CREATE INDEX "Piece_updatedAt_idx" ON "Piece"("updatedAt");

CREATE INDEX "OwnershipRecord_clientId_idx" ON "OwnershipRecord"("clientId");
CREATE INDEX "OwnershipRecord_acquiredAt_idx" ON "OwnershipRecord"("acquiredAt");

CREATE INDEX "Certificate_isActive_issuedAt_idx" ON "Certificate"("isActive", "issuedAt");
CREATE INDEX "Certificate_ownerId_idx" ON "Certificate"("ownerId");

CREATE INDEX "Order_placedAt_idx" ON "Order"("placedAt" DESC);
CREATE INDEX "Order_status_placedAt_idx" ON "Order"("status", "placedAt");

CREATE INDEX "TransferRequest_status_initiatedAt_idx" ON "TransferRequest"("status", "initiatedAt" DESC);

CREATE INDEX "VerificationLog_result_verifiedAt_idx" ON "VerificationLog"("result", "verifiedAt");
CREATE INDEX "VerificationLog_verifiedAt_idx" ON "VerificationLog"("verifiedAt");

CREATE INDEX "AdminUser_isActive_role_idx" ON "AdminUser"("isActive", "role");

CREATE TABLE "HouseSettings" (
    "id" TEXT NOT NULL,
    "houseName" TEXT NOT NULL,
    "description" TEXT,
    "contactEmail" TEXT,
    "supportContact" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'ar',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Riyadh',
    "privateHouseAccess" BOOLEAN NOT NULL DEFAULT true,
    "privateKeyRequired" BOOLEAN NOT NULL DEFAULT true,
    "adminApprovalRequired" BOOLEAN NOT NULL DEFAULT true,
    "allowInvitations" BOOLEAN NOT NULL DEFAULT true,
    "keyValidityMonths" INTEGER NOT NULL DEFAULT 12,
    "requireKeyRenewal" BOOLEAN NOT NULL DEFAULT true,
    "notificationPrefs" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "HouseSettings" (
    "id",
    "houseName",
    "description",
    "contactEmail",
    "supportContact",
    "locale",
    "timezone",
    "notificationPrefs",
    "updatedAt"
) VALUES (
    'default',
    'DADAN',
    'Private luxury jewelry ownership house',
    'hello@dadan.sa',
    '+966500000000',
    'ar',
    'Asia/Riyadh',
    '{
      "ownershipTransferRequest": true,
      "transferCompleted": true,
      "newMemberInvitation": true,
      "certificateIssued": true,
      "accessRequest": true,
      "paymentCompleted": true,
      "paymentFailed": true
    }'::jsonb,
    CURRENT_TIMESTAMP
);

CREATE TABLE "StaffRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "type" "StaffRequestType" NOT NULL,
    "status" "StaffRequestStatus" NOT NULL DEFAULT 'PENDING',
    "clientId" TEXT NOT NULL,
    "targetClassId" TEXT,
    "collectionId" TEXT,
    "notes" TEXT,
    "reviewNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffRequest_requestNumber_key" ON "StaffRequest"("requestNumber");
CREATE INDEX "StaffRequest_status_createdAt_idx" ON "StaffRequest"("status", "createdAt" DESC);
CREATE INDEX "StaffRequest_type_status_idx" ON "StaffRequest"("type", "status");
CREATE INDEX "StaffRequest_clientId_idx" ON "StaffRequest"("clientId");

ALTER TABLE "StaffRequest"
    ADD CONSTRAINT "StaffRequest_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON UPDATE CASCADE;

ALTER TABLE "StaffRequest"
    ADD CONSTRAINT "StaffRequest_collectionId_fkey"
    FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON UPDATE CASCADE;

ALTER TABLE "StaffRequest"
    ADD CONSTRAINT "StaffRequest_reviewedById_fkey"
    FOREIGN KEY ("reviewedById") REFERENCES "AdminUser"("id") ON UPDATE CASCADE;
