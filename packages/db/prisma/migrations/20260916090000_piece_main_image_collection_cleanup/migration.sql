-- Migration: piece_main_image_collection_cleanup
-- 1. Add mainImageUrl / mainImageLqip to Piece
-- 2. Promote existing imageUrls[1] → mainImageUrl (data move)
-- 3. Drop Collection story columns

-- Step 1: Add new columns
ALTER TABLE "Piece" ADD COLUMN "mainImageUrl" TEXT;
ALTER TABLE "Piece" ADD COLUMN "mainImageLqip" TEXT;

-- Step 2: Move first gallery image into main fields, leave rest as gallery
-- PostgreSQL arrays are 1-indexed; [2:] slices from index 2 to end.
UPDATE "Piece"
SET
  "mainImageUrl"  = "imageUrls"[1],
  "mainImageLqip" = "imageLqips"[1],
  "imageUrls"     = "imageUrls"[2:],
  "imageLqips"    = "imageLqips"[2:]
WHERE array_length("imageUrls", 1) > 0;

-- Step 3: Drop Collection story columns
ALTER TABLE "Collection" DROP COLUMN IF EXISTS "origin";
ALTER TABLE "Collection" DROP COLUMN IF EXISTS "originAr";
ALTER TABLE "Collection" DROP COLUMN IF EXISTS "meaning";
ALTER TABLE "Collection" DROP COLUMN IF EXISTS "meaningAr";
ALTER TABLE "Collection" DROP COLUMN IF EXISTS "inspiration";
ALTER TABLE "Collection" DROP COLUMN IF EXISTS "inspirationAr";
ALTER TABLE "Collection" DROP COLUMN IF EXISTS "storyContent";
ALTER TABLE "Collection" DROP COLUMN IF EXISTS "storyContentAr";
ALTER TABLE "Collection" DROP COLUMN IF EXISTS "storyImageUrls";
