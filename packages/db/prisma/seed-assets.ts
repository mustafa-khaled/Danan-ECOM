import { readFile } from "node:fs/promises";
import * as path from "node:path";
import { storage } from "@dadan/storage";

/** Local asset filename -> storage key used by the seed catalog. */
const SEED_IMAGES: Record<string, string> = {
  "noir-ring.jpg": "designs/seed/noir-ring.jpg",
  "noir-necklace.jpg": "designs/seed/noir-necklace.jpg",
  "noir-earrings.jpg": "designs/seed/noir-earrings.jpg",
  "heritage-bracelet.jpg": "designs/seed/heritage-bracelet.jpg",
  "heritage-earrings.jpg": "designs/seed/heritage-earrings.jpg",
  "heritage-pendant.jpg": "designs/seed/heritage-pendant.jpg",
  "oasis-ring.jpg": "designs/seed/oasis-ring.jpg",
  "oasis-bracelet.jpg": "designs/seed/oasis-bracelet.jpg",
  "oasis-choker.jpg": "designs/seed/oasis-choker.jpg",
};

export function seedImageKey(filename: string): string {
  const key = SEED_IMAGES[filename];
  if (!key) throw new Error(`Unknown seed image: ${filename}`);
  return key;
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
  const assetsDir = path.join(__dirname, "assets");

  for (const [filename, key] of Object.entries(SEED_IMAGES)) {
    const exists = await storage.exists(key);
    if (exists) {
      console.log(`  skip ${key} (already exists)`);
      continue;
    }

    const bytes = await readFile(path.join(assetsDir, filename));
    await storage.upload(key, bytes, { contentType: "image/jpeg" });
    console.log(`  uploaded ${key} (${(bytes.length / 1024).toFixed(0)} KB)`);
  }
}
