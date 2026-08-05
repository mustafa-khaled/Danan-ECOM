import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import * as path from "node:path";
import sharp from "sharp";
import { storage } from "@dadan/storage";
import { COLLECTIONS, DESIGNS } from "./seed-data";

// ---------------------------------------------------------------------------
// Seed assets — the single source of truth for every image the catalog uses.
//
// All files live in the `seeder-assets/` directory and are uploaded to storage
// under a deterministic `designs/seed/` or `collections/seed/` key. Every seed
// run wipes the storage root first, so the resulting store contains exactly the
// files referenced by the dataset and nothing else.
// ---------------------------------------------------------------------------

export interface SeedAsset {
  filename: string;
  key: string;
}

const MIME_BY_EXT: Record<string, string> = {
  avif: "image/avif",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export const SEED_ASSETS_DIR = path.resolve(
  process.env.SEED_ASSETS_DIR ??
    path.join(__dirname, "../../../apps/web/public/seeder-assets"),
);

export const SEED_ASSETS: SeedAsset[] = [
  ...COLLECTIONS.map((c) => ({ filename: c.cover, key: `collections/seed/${c.cover}` })),
  ...DESIGNS.flatMap((d) =>
    d.images.map((image) => ({ filename: image, key: `designs/seed/${image}` })),
  ),
];

export function seedCoverKey(filename: string): string {
  const key = `collections/seed/${filename}`;
  if (!SEED_ASSETS.some((a) => a.key === key)) {
    throw new Error(`Unknown collection cover asset: ${filename}`);
  }
  return key;
}

export function seedImageKey(filename: string): string {
  const key = `designs/seed/${filename}`;
  if (!SEED_ASSETS.some((a) => a.key === key)) {
    throw new Error(`Unknown design image asset: ${filename}`);
  }
  return key;
}

function contentTypeFor(filename: string): string {
  const ext = path.extname(filename).slice(1).toLowerCase();
  const mime = MIME_BY_EXT[ext];
  if (!mime) {
    throw new Error(`Unsupported seed asset extension: ${ext}`);
  }
  return mime;
}

/** Throws unless every referenced asset exists in the seeder-assets directory. */
export function validateSeedAssets(): void {
  const missing = SEED_ASSETS.filter(
    (asset) => !existsSync(path.join(SEED_ASSETS_DIR, asset.filename)),
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing seed assets (expected in ${SEED_ASSETS_DIR}):\n  ` +
        missing.map((a) => a.filename).join("\n  "),
    );
  }
}

const lqipCache = new Map<string, Promise<string>>();

/** Deterministic low-quality image placeholder (base64 webp data URL) for blur-up. */
export function seedLqip(filename: string): Promise<string> {
  const cached = lqipCache.get(filename);
  if (cached) {
    return cached;
  }
  const filePath = path.join(SEED_ASSETS_DIR, filename);
  const promise = sharp(filePath)
    .resize(20, 25, { fit: "cover" })
    .blur(5)
    .webp({ quality: 20 })
    .toBuffer()
    .then((webp) => `data:image/webp;base64,${webp.toString("base64")}`);
  lqipCache.set(filename, promise);
  return promise;
}

export interface SeedAssetResult {
  uploaded: number;
}

/** Wipes the storage root, then uploads exactly the referenced assets. */
export async function seedAssets(): Promise<SeedAssetResult> {
  validateSeedAssets();

  console.log("Preparing storage (wiping existing files)...");
  await storage.removeAll();

  let uploaded = 0;
  for (const asset of SEED_ASSETS) {
    const filePath = path.join(SEED_ASSETS_DIR, asset.filename);
    const bytes = await readFile(filePath);
    await storage.upload(asset.key, bytes, { contentType: contentTypeFor(asset.filename) });
    console.log(`  ✓ ${asset.key} (${(bytes.length / 1024).toFixed(0)} KB)`);
    uploaded++;
  }

  return { uploaded };
}
