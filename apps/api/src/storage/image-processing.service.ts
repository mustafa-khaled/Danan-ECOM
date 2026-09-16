import { BadRequestException, Injectable } from "@nestjs/common";
import sharp from "sharp";
import { validateMagicBytes } from "@dadan/storage";
import { StorageService } from "./storage.service";

export interface ImageVariants {
  /** Storage key of the served image. The only key any record persists. */
  webp: string;
  /** Inlined blur placeholder. Stored on the row, not in object storage. */
  lqipDataUrl: string;
}

const LQIP_WIDTH = 20;
const LQIP_HEIGHT = 25;
const WEBP_QUALITY = 85;
const LQIP_QUALITY = 20;
const MAX_DIMENSION = 4096;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

@Injectable()
export class ImageProcessingService {
  constructor(private readonly storage: StorageService) {}

  async validateDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      throw new Error(`Image dimensions exceed ${MAX_DIMENSION}px limit`);
    }

    return { width, height };
  }

  async processAndUpload(
    buffer: Buffer,
    baseKey: string,
    contentType: string,
  ): Promise<ImageVariants> {
    // M-04: Re-validate buffer size as defense-in-depth beyond multer's limit
    if (buffer.length > MAX_FILE_SIZE) {
      throw new BadRequestException("File exceeds maximum allowed size");
    }
    await validateMagicBytes(buffer, contentType);
    await this.validateDimensions(buffer);

    const image = sharp(buffer);
    const ext = this.getExtension(baseKey);
    const keyWithoutExt = baseKey.replace(new RegExp(`\\.${ext}$`), "");

    const webpKey = `${keyWithoutExt}.webp`;

    // Only the webp key is ever written to a row, so it is the only object worth
    // storing: the original, a thumbnail and a standalone lqip file used to be
    // uploaded too, but nothing referenced them and `deletePieceFiles` could not
    // find them to clean up, so every upload leaked three objects.
    const [webpBuffer, lqipBuffer] = await Promise.all([
      image.clone().webp({ quality: WEBP_QUALITY }).toBuffer(),
      image
        .clone()
        .resize(LQIP_WIDTH, LQIP_HEIGHT, { fit: "cover" })
        .blur(5)
        .webp({ quality: LQIP_QUALITY })
        .toBuffer(),
    ]);

    await this.storage.upload(webpKey, webpBuffer, {
      contentType: "image/webp",
    });

    return {
      webp: webpKey,
      lqipDataUrl: `data:image/webp;base64,${lqipBuffer.toString("base64")}`,
    };
  }

  async generateLqipDataUrl(buffer: Buffer): Promise<string> {
    const lqipBuffer = await sharp(buffer)
      .resize(LQIP_WIDTH, LQIP_HEIGHT, { fit: "cover" })
      .blur(5)
      .webp({ quality: LQIP_QUALITY })
      .toBuffer();

    return `data:image/webp;base64,${lqipBuffer.toString("base64")}`;
  }

  private getExtension(key: string): string {
    const parts = key.split(".");
    return parts.length > 1 ? (parts[parts.length - 1] ?? "") : "";
  }
}
