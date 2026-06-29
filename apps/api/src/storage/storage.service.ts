import { Injectable } from "@nestjs/common";
import { storage } from "@dadan/storage";
import type { SignedUrlOptions, UploadOptions } from "@dadan/storage";

@Injectable()
export class StorageService {
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
}
