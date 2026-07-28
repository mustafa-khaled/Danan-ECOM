import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { storage } from "@dadan/storage";
import type { SignedUrlOptions, UploadOptions } from "@dadan/storage";

const DEFAULT_ASSET_EXPIRY = 3600;

@Injectable()
export class StorageService {
  constructor(private readonly config: ConfigService) {}

  upload(key: string, body: Buffer, options: UploadOptions): Promise<string> {
    return storage.upload(key, body, options);
  }

  download(key: string): Promise<Buffer> {
    return storage.download(key);
  }

  getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    return storage.getSignedUrl(key, options);
  }

  delete(key: string): Promise<void> {
    return storage.delete(key);
  }

  exists(key: string): Promise<boolean> {
    return storage.exists(key);
  }

  async resolvePublicUrl(
    key: string | null | undefined,
    expiresInSeconds = DEFAULT_ASSET_EXPIRY,
  ): Promise<string | null> {
    if (!key) return null;
    if (key.startsWith("http://") || key.startsWith("https://")) {
      return key;
    }
    const signedUrl = await this.getSignedUrl(key, { expiresInSeconds });
    if (signedUrl.startsWith("http://") || signedUrl.startsWith("https://")) {
      return signedUrl;
    }
    const webOrigin =
      this.config.get<string>("WEB_ORIGIN") ?? "http://localhost:3000";
    const separator = signedUrl.startsWith("/") ? "" : "/";
    return `${webOrigin}${separator}${signedUrl}`;
  }

  async resolvePublicUrls(
    keys: string[],
    expiresInSeconds = DEFAULT_ASSET_EXPIRY,
  ): Promise<string[]> {
    const urls = await Promise.all(
      keys.map((key) => this.resolvePublicUrl(key, expiresInSeconds)),
    );
    return urls.filter((url): url is string => url !== null);
  }
}
