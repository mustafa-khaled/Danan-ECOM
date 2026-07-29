import { Injectable } from "@nestjs/common";
import sharp from "sharp";
import { StorageService } from "./storage.service";

export interface ImageVariants {
  original: string;
  webp: string;
  thumbnail: string;
  lqip: string;
  lqipDataUrl: string;
}

const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_HEIGHT = 500;
const LQIP_WIDTH = 20;
const LQIP_HEIGHT = 25;
const WEBP_QUALITY = 85;
const THUMBNAIL_QUALITY = 80;
const LQIP_QUALITY = 20;
const MAX_DIMENSION = 4096;

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
    await this.validateDimensions(buffer);

    const image = sharp(buffer);
    const ext = this.getExtension(baseKey);
    const keyWithoutExt = baseKey.replace(new RegExp(`\\.${ext}$`), "");

    const webpKey = `${keyWithoutExt}.webp`;
    const thumbnailKey = `${keyWithoutExt}-thumb.webp`;
    const lqipKey = `${keyWithoutExt}-lqip.webp`;

    const [webpBuffer, thumbnailBuffer, lqipBuffer] = await Promise.all([
      image.clone().webp({ quality: WEBP_QUALITY }).toBuffer(),
      image
        .clone()
        .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, { fit: "cover" })
        .webp({ quality: THUMBNAIL_QUALITY })
        .toBuffer(),
      image
        .clone()
        .resize(LQIP_WIDTH, LQIP_HEIGHT, { fit: "cover" })
        .blur(5)
        .webp({ quality: LQIP_QUALITY })
        .toBuffer(),
    ]);

    const lqipDataUrl = `data:image/webp;base64,${lqipBuffer.toString("base64")}`;

    await Promise.all([
      this.storage.upload(baseKey, buffer, { contentType }),
      this.storage.upload(webpKey, webpBuffer, { contentType: "image/webp" }),
      this.storage.upload(thumbnailKey, thumbnailBuffer, { contentType: "image/webp" }),
      this.storage.upload(lqipKey, lqipBuffer, { contentType: "image/webp" }),
    ]);

    return {
      original: baseKey,
      webp: webpKey,
      thumbnail: thumbnailKey,
      lqip: lqipKey,
      lqipDataUrl,
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
