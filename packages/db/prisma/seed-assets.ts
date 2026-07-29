import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import * as path from "node:path";
import { storage } from "@dadan/storage";

interface SeedImageConfig {
  filename: string;
  storageKey: string;
  contentType: string;
  sourceDir: "assets" | "web-products" | "web-collections" | "web-assets";
}

const WEB_PUBLIC_DIR = path.resolve(__dirname, "../../../apps/web/public");

const SEED_IMAGES: SeedImageConfig[] = [
  { filename: "noir-ring.jpg", storageKey: "designs/seed/noir-ring.jpg", contentType: "image/jpeg", sourceDir: "assets" },
  { filename: "noir-necklace.jpg", storageKey: "designs/seed/noir-necklace.jpg", contentType: "image/jpeg", sourceDir: "assets" },
  { filename: "noir-earrings.jpg", storageKey: "designs/seed/noir-earrings.jpg", contentType: "image/jpeg", sourceDir: "assets" },
  { filename: "heritage-bracelet.jpg", storageKey: "designs/seed/heritage-bracelet.jpg", contentType: "image/jpeg", sourceDir: "assets" },
  { filename: "heritage-earrings.jpg", storageKey: "designs/seed/heritage-earrings.jpg", contentType: "image/jpeg", sourceDir: "assets" },
  { filename: "heritage-pendant.jpg", storageKey: "designs/seed/heritage-pendant.jpg", contentType: "image/jpeg", sourceDir: "assets" },
  { filename: "oasis-ring.jpg", storageKey: "designs/seed/oasis-ring.jpg", contentType: "image/jpeg", sourceDir: "assets" },
  { filename: "oasis-bracelet.jpg", storageKey: "designs/seed/oasis-bracelet.jpg", contentType: "image/jpeg", sourceDir: "assets" },
  { filename: "oasis-choker.jpg", storageKey: "designs/seed/oasis-choker.jpg", contentType: "image/jpeg", sourceDir: "assets" },

  { filename: "col1.png", storageKey: "collections/seed/col1.png", contentType: "image/png", sourceDir: "web-collections" },
  { filename: "col2.png", storageKey: "collections/seed/col2.png", contentType: "image/png", sourceDir: "web-collections" },
  { filename: "col3.png", storageKey: "collections/seed/col3.png", contentType: "image/png", sourceDir: "web-collections" },

  { filename: "product-1.png", storageKey: "designs/seed/product-1.png", contentType: "image/png", sourceDir: "web-products" },
  { filename: "product-2.png", storageKey: "designs/seed/product-2.png", contentType: "image/png", sourceDir: "web-products" },
  { filename: "product-3.png", storageKey: "designs/seed/product-3.png", contentType: "image/png", sourceDir: "web-products" },

  { filename: "W7.png", storageKey: "designs/seed/mawaddah-1.png", contentType: "image/png", sourceDir: "web-assets" },
  { filename: "W8.png", storageKey: "designs/seed/mawaddah-2.png", contentType: "image/png", sourceDir: "web-assets" },
  { filename: "W9.png", storageKey: "designs/seed/mawaddah-3.png", contentType: "image/png", sourceDir: "web-assets" },
  { filename: "W10.png", storageKey: "designs/seed/mawaddah-4.png", contentType: "image/png", sourceDir: "web-assets" },
  { filename: "W12.png", storageKey: "designs/seed/mawaddah-5.png", contentType: "image/png", sourceDir: "web-assets" },
  { filename: "W13.png", storageKey: "designs/seed/mawaddah-6.png", contentType: "image/png", sourceDir: "web-assets" },
  { filename: "heritage-pendant.png", storageKey: "designs/seed/heritage-pendant-alt.png", contentType: "image/png", sourceDir: "web-assets" },
];

const SEED_IMAGE_MAP: Record<string, string> = Object.fromEntries(
  SEED_IMAGES.map((img) => [img.filename, img.storageKey]),
);

export function seedImageKey(filename: string): string {
  const key = SEED_IMAGE_MAP[filename];
  if (!key) throw new Error(`Unknown seed image: ${filename}`);
  return key;
}

function getSourceDirectory(sourceDir: SeedImageConfig["sourceDir"]): string {
  switch (sourceDir) {
    case "assets":
      return path.join(__dirname, "assets");
    case "web-products":
      return path.join(WEB_PUBLIC_DIR, "products");
    case "web-collections":
      return path.join(WEB_PUBLIC_DIR, "collections");
    case "web-assets":
      return path.join(WEB_PUBLIC_DIR, "assets");
    default:
      throw new Error(`Unknown source directory: ${sourceDir}`);
  }
}

export async function seedAssets(): Promise<void> {
  const provider = process.env.STORAGE_PROVIDER ?? "local";

  if (provider !== "local") {
    const missing = [!process.env.S3_ENDPOINT, !process.env.S3_ACCESS_KEY, !process.env.S3_SECRET_KEY];
    if (missing.some(Boolean)) {
      console.log("Skipping seed assets (remote storage not configured)");
      return;
    }
  }

  console.log("Uploading seed catalog images...");

  for (const image of SEED_IMAGES) {
    const exists = await storage.exists(image.storageKey);
    if (exists) {
      console.log(`  skip ${image.storageKey} (already exists)`);
      continue;
    }

    const sourceDir = getSourceDirectory(image.sourceDir);
    const filePath = path.join(sourceDir, image.filename);

    if (!existsSync(filePath)) {
      console.log(`  skip ${image.storageKey} (source file not found: ${filePath})`);
      continue;
    }

    const bytes = await readFile(filePath);
    await storage.upload(image.storageKey, bytes, { contentType: image.contentType });
    console.log(`  uploaded ${image.storageKey} (${(bytes.length / 1024).toFixed(0)} KB)`);
  }
}
