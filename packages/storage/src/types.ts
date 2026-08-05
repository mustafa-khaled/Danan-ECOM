export interface StorageConfig {
  provider?: "local" | "s3" | "r2" | "hetzner";
  localPath?: string;
  endpoint?: string;
  bucket?: string;
  accessKey?: string;
  secretKey?: string;
  region?: string;
  forcePathStyle?: boolean;
}

export interface UploadOptions {
  contentType: string;
  maxBytes?: number;
}

export interface SignedUrlOptions {
  expiresInSeconds?: number;
}

export const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export const ALLOWED_PDF_MIME = "application/pdf";

export const DEFAULT_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const DEFAULT_MAX_PDF_BYTES = 20 * 1024 * 1024;
export const DEFAULT_SIGNED_URL_EXPIRY = 3600;
