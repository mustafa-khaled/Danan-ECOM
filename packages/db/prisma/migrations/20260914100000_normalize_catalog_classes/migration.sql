-- Normalize catalog: drop Design, add Class + CollectionClass, fold catalog fields onto Piece.

-- ============================================================================
-- CLASS
-- ============================================================================

CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Class_slug_key" ON "Class"("slug");
CREATE INDEX "Class_isDefault_idx" ON "Class"("isDefault");
CREATE INDEX "Class_isActive_sortOrder_idx" ON "Class"("isActive", "sortOrder");
CREATE UNIQUE INDEX "one_default_class" ON "Class"("isDefault") WHERE "isDefault" = true;

INSERT INTO "Class" ("id", "name", "nameAr", "slug", "description", "sortOrder", "isDefault", "isActive", "createdAt", "updatedAt")
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Class A', 'الفئة أ', 'class-a', 'Full House Access', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-222222222222', 'Class B', 'الفئة ب', 'class-b', 'Curated House Access', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('33333333-3333-3333-3333-333333333333', 'Class C', 'الفئة ج', 'class-c', 'Standard House Access', 3, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================================================
-- COLLECTION CLASS JOIN
-- ============================================================================

CREATE TABLE "CollectionClass" (
    "collectionId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,

    CONSTRAINT "CollectionClass_pkey" PRIMARY KEY ("collectionId", "classId")
);

CREATE INDEX "CollectionClass_classId_idx" ON "CollectionClass"("classId");

ALTER TABLE "CollectionClass"
    ADD CONSTRAINT "CollectionClass_collectionId_fkey"
    FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CollectionClass"
    ADD CONSTRAINT "CollectionClass_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- CLIENT.classId
-- ============================================================================

ALTER TABLE "Client" ADD COLUMN "classId" TEXT;

UPDATE "Client" SET "classId" = '33333333-3333-3333-3333-333333333333';

ALTER TABLE "Client" ALTER COLUMN "classId" SET NOT NULL;

ALTER TABLE "Client"
    ADD CONSTRAINT "Client_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "Class"("id") ON UPDATE CASCADE;

CREATE INDEX "Client_classId_idx" ON "Client"("classId");

-- ============================================================================
-- PIECE CATALOG COLUMNS (nullable first, then backfill from Design)
-- ============================================================================

ALTER TABLE "Piece" ADD COLUMN "collectionId" TEXT;
ALTER TABLE "Piece" ADD COLUMN "name" TEXT;
ALTER TABLE "Piece" ADD COLUMN "nameAr" TEXT;
ALTER TABLE "Piece" ADD COLUMN "slug" TEXT;
ALTER TABLE "Piece" ADD COLUMN "story" TEXT;
ALTER TABLE "Piece" ADD COLUMN "storyAr" TEXT;
ALTER TABLE "Piece" ADD COLUMN "material" TEXT;
ALTER TABLE "Piece" ADD COLUMN "materialAr" TEXT;
ALTER TABLE "Piece" ADD COLUMN "weight" DECIMAL(10,3);
ALTER TABLE "Piece" ADD COLUMN "dimensions" TEXT;
ALTER TABLE "Piece" ADD COLUMN "dimensionsAr" TEXT;
ALTER TABLE "Piece" ADD COLUMN "imageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Piece" ADD COLUMN "imageLqips" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Piece" ADD COLUMN "price" DECIMAL(12,2);
ALTER TABLE "Piece" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'SAR';
ALTER TABLE "Piece" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Piece" AS p
SET
    "collectionId" = d."collectionId",
    "name" = d."name",
    "nameAr" = d."nameAr",
    "slug" = d."slug" || '-' || right(replace(p."serialNumber", '-', ''), 6),
    "story" = d."story",
    "storyAr" = d."storyAr",
    "material" = d."material",
    "materialAr" = d."materialAr",
    "weight" = d."weight",
    "dimensions" = d."dimensions",
    "dimensionsAr" = d."dimensionsAr",
    "imageUrls" = d."imageUrls",
    "imageLqips" = d."imageLqips",
    "price" = d."basePrice",
    "currency" = d."currency",
    "isActive" = d."isActive"
FROM "Design" AS d
WHERE p."designId" = d.id;

-- Pieces without a design (should not exist) get safe fallbacks so NOT NULL can apply.
UPDATE "Piece"
SET
    "collectionId" = COALESCE("collectionId", (SELECT "id" FROM "Collection" LIMIT 1)),
    "name" = COALESCE("name", 'Untitled piece'),
    "slug" = COALESCE("slug", "id"),
    "story" = COALESCE("story", ''),
    "material" = COALESCE("material", ''),
    "weight" = COALESCE("weight", 0.001),
    "dimensions" = COALESCE("dimensions", ''),
    "price" = COALESCE("price", 0)
WHERE "collectionId" IS NULL
   OR "name" IS NULL
   OR "slug" IS NULL
   OR "story" IS NULL
   OR "material" IS NULL
   OR "weight" IS NULL
   OR "dimensions" IS NULL
   OR "price" IS NULL;

ALTER TABLE "Piece" ALTER COLUMN "collectionId" SET NOT NULL;
ALTER TABLE "Piece" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "Piece" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Piece" ALTER COLUMN "story" SET NOT NULL;
ALTER TABLE "Piece" ALTER COLUMN "material" SET NOT NULL;
ALTER TABLE "Piece" ALTER COLUMN "weight" SET NOT NULL;
ALTER TABLE "Piece" ALTER COLUMN "dimensions" SET NOT NULL;
ALTER TABLE "Piece" ALTER COLUMN "price" SET NOT NULL;

CREATE UNIQUE INDEX "Piece_slug_key" ON "Piece"("slug");
CREATE INDEX "Piece_collectionId_status_idx" ON "Piece"("collectionId", "status");
CREATE INDEX "Piece_collectionId_isActive_idx" ON "Piece"("collectionId", "isActive");

ALTER TABLE "Piece"
    ADD CONSTRAINT "Piece_collectionId_fkey"
    FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON UPDATE CASCADE;

ALTER TABLE "Piece"
    ADD CONSTRAINT "piece_weight_positive"
    CHECK ("weight" > 0);

ALTER TABLE "Piece"
    ADD CONSTRAINT "piece_price_nonnegative"
    CHECK ("price" >= 0);

-- ============================================================================
-- PIECE SPECIFICATIONS (copy from DesignSpecification)
-- ============================================================================

CREATE TABLE "PieceSpecification" (
    "id" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "keyAr" TEXT,
    "value" TEXT NOT NULL,
    "valueAr" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PieceSpecification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PieceSpecification_pieceId_key_key" ON "PieceSpecification"("pieceId", "key");

ALTER TABLE "PieceSpecification"
    ADD CONSTRAINT "PieceSpecification_pieceId_fkey"
    FOREIGN KEY ("pieceId") REFERENCES "Piece"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "PieceSpecification" ("id", "pieceId", "key", "keyAr", "value", "valueAr", "sortOrder")
SELECT
    gen_random_uuid()::text,
    p.id,
    ds."key",
    ds."keyAr",
    ds."value",
    ds."valueAr",
    ds."sortOrder"
FROM "Piece" p
JOIN "DesignSpecification" ds ON ds."designId" = p."designId";

-- ============================================================================
-- ORDER ITEM SNAPSHOTS
-- ============================================================================

ALTER TABLE "OrderItem" ADD COLUMN "nameSnapshot" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "collectionNameSnapshot" TEXT;

UPDATE "OrderItem" AS oi
SET
    "nameSnapshot" = COALESCE(d."name", 'Untitled piece'),
    "collectionNameSnapshot" = c."name"
FROM "Design" AS d
LEFT JOIN "Collection" AS c ON c.id = d."collectionId"
WHERE oi."designId" = d.id;

UPDATE "OrderItem"
SET "nameSnapshot" = COALESCE("nameSnapshot", 'Untitled piece')
WHERE "nameSnapshot" IS NULL;

ALTER TABLE "OrderItem" ALTER COLUMN "nameSnapshot" SET NOT NULL;

-- ============================================================================
-- DROP DESIGN LAYER AND VISIBILITY GROUPS
-- ============================================================================

ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_designId_fkey";
DROP INDEX IF EXISTS "OrderItem_designId_idx";
ALTER TABLE "OrderItem" DROP COLUMN "designId";

ALTER TABLE "Piece" DROP CONSTRAINT IF EXISTS "Piece_designId_fkey";
DROP INDEX IF EXISTS "Piece_designId_status_idx";
ALTER TABLE "Piece" DROP COLUMN "designId";

DROP TABLE IF EXISTS "DesignSpecification";
DROP TABLE IF EXISTS "Design";

ALTER TABLE "Client" DROP COLUMN "visibilityGroups";
ALTER TABLE "Collection" DROP COLUMN "visibilityGroups";
