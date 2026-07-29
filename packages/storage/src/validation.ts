// Ambient types for consumers using legacy moduleResolution (e.g. @dadan/api).
// eslint-disable-next-line @typescript-eslint/triple-slash-reference -- .d.ts shim has no import form
/// <reference path="./file-type.d.ts" />
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

export async function validateMagicBytes(
  buffer: Buffer,
  declaredContentType: string,
): Promise<void> {
  const { fileTypeFromBuffer } = await import("file-type");
  const detected = await fileTypeFromBuffer(buffer);

  if (declaredContentType === ALLOWED_PDF_MIME) {
    if (!detected || detected.mime !== "application/pdf") {
      throw new Error("File content does not match declared PDF type");
    }
    return;
  }

  if (ALLOWED_IMAGE_MIMES.has(declaredContentType)) {
    if (!detected || !ALLOWED_IMAGE_MIMES.has(detected.mime)) {
      throw new Error("File content does not match declared image type");
    }
    return;
  }

  throw new Error("Unsupported file type");
}
