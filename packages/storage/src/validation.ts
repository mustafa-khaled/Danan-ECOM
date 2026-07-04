import {
  ALLOWED_IMAGE_MIMES,
  ALLOWED_PDF_MIME,
  DEFAULT_MAX_IMAGE_BYTES,
  DEFAULT_MAX_PDF_BYTES,
} from "./types";

export function validateUpload(contentType: string, size: number, maxBytes?: number): void {
  const isPdf = contentType === ALLOWED_PDF_MIME;
  const isImage = ALLOWED_IMAGE_MIMES.has(contentType);

  if (!isPdf && !isImage) {
    throw new Error("Unsupported file type");
  }

  const limit = maxBytes ?? (isPdf ? DEFAULT_MAX_PDF_BYTES : DEFAULT_MAX_IMAGE_BYTES);
  if (size > limit) {
    throw new Error("File exceeds maximum allowed size");
  }
}
