-- AlterTable
ALTER TABLE "Collection" ADD COLUMN "coverImageLqip" TEXT;

-- AlterTable
ALTER TABLE "Design" ADD COLUMN "imageLqips" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
