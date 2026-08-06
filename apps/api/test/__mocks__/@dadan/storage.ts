export const storage = {
  upload: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(false),
  stat: jest.fn().mockResolvedValue({ size: 100, mtimeMs: 1700000000000 }),
  createReadStream: jest.fn(),
  getSignedUrl: jest.fn().mockResolvedValue("https://mock-url.test/file.png"),
  delete: jest.fn().mockResolvedValue(undefined),
};

export function certificatePdfKey(certId: string): string {
  return `certificates/${certId}.pdf`;
}

export function designImageKey(
  designId: string,
  fileId: string,
  ext: string,
): string {
  return `designs/${designId}/${fileId}.${ext}`;
}

export function collectionCoverKey(collectionId: string, ext: string): string {
  return `collections/${collectionId}/cover.${ext}`;
}

export function extFromMime(): string {
  return "png";
}

export const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
export const ALLOWED_PDF_MIME = "application/pdf";
export const DEFAULT_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const DEFAULT_MAX_PDF_BYTES = 20 * 1024 * 1024;
export const DEFAULT_SIGNED_URL_EXPIRY = 3600;
