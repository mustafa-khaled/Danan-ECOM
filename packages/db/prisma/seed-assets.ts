import { storage } from "@dadan/storage";

const PLACEHOLDER_KEYS = [
  "designs/placeholder/noir-ring.jpg",
  "designs/placeholder/noir-necklace.jpg",
  "designs/placeholder/heritage-bracelet.jpg",
  "designs/placeholder/heritage-earrings.jpg",
] as const;

// Minimal valid 1x1 JPEG
const PLACEHOLDER_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A0f/Z",
  "base64",
);

export async function seedR2Placeholders(): Promise<void> {
  if (!process.env.S3_ENDPOINT || !process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY) {
    console.log("Skipping R2 seed assets (S3 env not configured)");
    return;
  }

  console.log("Uploading seed placeholder images to R2...");

  for (const key of PLACEHOLDER_KEYS) {
    const exists = await storage.exists(key);
    if (exists) {
      console.log(`  skip ${key} (already exists)`);
      continue;
    }

    await storage.upload(key, PLACEHOLDER_JPEG, { contentType: "image/jpeg" });
    console.log(`  uploaded ${key}`);
  }
}
