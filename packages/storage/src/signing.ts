import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Key prefixes holding per-owner private documents. The upload route is
 * unauthenticated so that catalog imagery can be loaded by `<img>` tags, which
 * means anything private has to carry its own proof of authorisation.
 */
const PRIVATE_KEY_PREFIXES = ["certificates/"];

export function requiresSignature(key: string): boolean {
  return PRIVATE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function signingSecret(): string {
  const secret = process.env.CERT_SIGNING_SECRET;
  if (!secret) {
    throw new Error(
      "CERT_SIGNING_SECRET is required to sign and verify private storage URLs",
    );
  }
  return secret;
}

function computeSignature(key: string, expiresAtSeconds: number): string {
  // The expiry is inside the MAC, so it cannot be extended without the secret.
  return createHmac("sha256", signingSecret())
    .update(key)
    .update("\0")
    .update(String(expiresAtSeconds))
    .digest("hex");
}

export function signStorageKey(
  key: string,
  expiresInSeconds: number,
): { expiresAt: number; signature: string } {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return { expiresAt, signature: computeSignature(key, expiresAt) };
}

export function verifyStorageSignature(
  key: string,
  expiresAt: number,
  signature: string,
): boolean {
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= 0) return false;
  if (expiresAt < Math.floor(Date.now() / 1000)) return false;

  const expected = computeSignature(key, expiresAt);
  const provided = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (provided.length !== expectedBuffer.length) return false;

  try {
    return timingSafeEqual(expectedBuffer, provided);
  } catch {
    return false;
  }
}
