import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import * as path from "node:path";
import { storage } from "@dadan/storage";

interface SeedImageConfig {
  filename: string;
  storageKey: string;
  contentType: string;
  sourceDir: "web-products" | "web-collections";
}

const WEB_PUBLIC_DIR = path.resolve(__dirname, "../../../apps/web/public");

const SEED_IMAGES: SeedImageConfig[] = [
  // Product / design images (W-prefixed from apps/web/public/products/)
  { filename: "W7.png", storageKey: "designs/seed/W7.png", contentType: "image/png", sourceDir: "web-products" },
  { filename: "W8.png", storageKey: "designs/seed/W8.png", contentType: "image/png", sourceDir: "web-products" },
  { filename: "W9.png", storageKey: "designs/seed/W9.png", contentType: "image/png", sourceDir: "web-products" },
  { filename: "W10.png", storageKey: "designs/seed/W10.png", contentType: "image/png", sourceDir: "web-products" },
  { filename: "W12.png", storageKey: "designs/seed/W12.png", contentType: "image/png", sourceDir: "web-products" },
  { filename: "W13.png", storageKey: "designs/seed/W13.png", contentType: "image/png", sourceDir: "web-products" },
  { filename: "W14.png", storageKey: "designs/seed/W14.png", contentType: "image/png", sourceDir: "web-products" },
  { filename: "W15.png", storageKey: "designs/seed/W15.png", contentType: "image/png", sourceDir: "web-products" },
  { filename: "W16.png", storageKey: "designs/seed/W16.png", contentType: "image/png", sourceDir: "web-products" },
  { filename: "W17.png", storageKey: "designs/seed/W17.png", contentType: "image/png", sourceDir: "web-products" },
  { filename: "W18.png", storageKey: "designs/seed/W18.png", contentType: "image/png", sourceDir: "web-products" },

  // Collection cover images (W-prefixed from apps/web/public/collections/)
  { filename: "W24.png", storageKey: "collections/seed/W24.png", contentType: "image/png", sourceDir: "web-collections" },
  { filename: "W25.png", storageKey: "collections/seed/W25.png", contentType: "image/png", sourceDir: "web-collections" },
  { filename: "W26.png", storageKey: "collections/seed/W26.png", contentType: "image/png", sourceDir: "web-collections" },
  { filename: "W27.png", storageKey: "collections/seed/W27.png", contentType: "image/png", sourceDir: "web-collections" },
  { filename: "W28.png", storageKey: "collections/seed/W28.png", contentType: "image/png", sourceDir: "web-collections" },
  { filename: "W29.png", storageKey: "collections/seed/W29.png", contentType: "image/png", sourceDir: "web-collections" },
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
    case "web-products":
      return path.join(WEB_PUBLIC_DIR, "products");
    case "web-collections":
      return path.join(WEB_PUBLIC_DIR, "collections");
    default:
      throw new Error(`Unknown source directory: ${sourceDir}`);
  }
}

export async function seedAssets(): Promise<{ uploaded: number; skipped: number; missing: number }> {
  const provider = process.env.STORAGE_PROVIDER ?? "local";

  if (provider !== "local") {
    const missing = [!process.env.S3_ENDPOINT, !process.env.S3_ACCESS_KEY, !process.env.S3_SECRET_KEY];
    if (missing.some(Boolean)) {
      console.log("⏭  Skipping seed assets (remote storage not configured)");
      return { uploaded: 0, skipped: SEED_IMAGES.length, missing: 0 };
    }
  }

  console.log("Uploading seed catalog images...");
  let uploaded = 0;
  let skipped = 0;
  let missingCount = 0;

  for (const image of SEED_IMAGES) {
    const exists = await storage.exists(image.storageKey);
    if (exists) {
      skipped++;
      continue;
    }

    const sourceDir = getSourceDirectory(image.sourceDir);
    const filePath = path.join(sourceDir, image.filename);

    if (!existsSync(filePath)) {
      console.log(`  ✗ ${image.storageKey} (source not found: ${filePath})`);
      missingCount++;
      continue;
    }

    const bytes = await readFile(filePath);
    await storage.upload(image.storageKey, bytes, { contentType: image.contentType });
    console.log(`  ✓ ${image.storageKey} (${(bytes.length / 1024).toFixed(0)} KB)`);
    uploaded++;
  }

  return { uploaded, skipped, missing: missingCount };
}
