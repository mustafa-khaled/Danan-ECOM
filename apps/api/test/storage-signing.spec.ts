import {
  requiresSignature,
  signStorageKey,
  verifyStorageSignature,
} from "../../../packages/storage/src/signing";

const CERT_KEY = "certificates/9f1c0f8e-1a2b-4c3d-8e5f-6a7b8c9d0e1f.pdf";

describe("private storage URL signing", () => {
  const originalSecret = process.env.CERT_SIGNING_SECRET;

  beforeAll(() => {
    process.env.CERT_SIGNING_SECRET = "unit-test-cert-signing-secret";
  });

  afterAll(() => {
    process.env.CERT_SIGNING_SECRET = originalSecret;
  });

  describe("requiresSignature", () => {
    it("treats certificates as private", () => {
      expect(requiresSignature(CERT_KEY)).toBe(true);
    });

    it("leaves catalog imagery public so <img> tags keep working", () => {
      expect(requiresSignature("designs/abc/cover.webp")).toBe(false);
      expect(requiresSignature("collections/abc/cover.jpg")).toBe(false);
    });
  });

  describe("verifyStorageSignature", () => {
    it("accepts a freshly minted signature", () => {
      const { expiresAt, signature } = signStorageKey(CERT_KEY, 3600);
      expect(verifyStorageSignature(CERT_KEY, expiresAt, signature)).toBe(true);
    });

    it("rejects a signature minted for a different key", () => {
      const { expiresAt, signature } = signStorageKey(CERT_KEY, 3600);
      expect(
        verifyStorageSignature("certificates/someone-elses.pdf", expiresAt, signature),
      ).toBe(false);
    });

    it("rejects an expiry extended after signing", () => {
      const { expiresAt, signature } = signStorageKey(CERT_KEY, 3600);
      expect(verifyStorageSignature(CERT_KEY, expiresAt + 86_400, signature)).toBe(
        false,
      );
    });

    it("rejects an expired signature", () => {
      const { expiresAt, signature } = signStorageKey(CERT_KEY, -10);
      expect(verifyStorageSignature(CERT_KEY, expiresAt, signature)).toBe(false);
    });

    it("rejects a missing or malformed signature instead of throwing", () => {
      const { expiresAt } = signStorageKey(CERT_KEY, 3600);
      expect(verifyStorageSignature(CERT_KEY, expiresAt, "")).toBe(false);
      expect(verifyStorageSignature(CERT_KEY, expiresAt, "deadbeef")).toBe(false);
      expect(verifyStorageSignature(CERT_KEY, Number.NaN, "deadbeef")).toBe(false);
    });
  });
});
