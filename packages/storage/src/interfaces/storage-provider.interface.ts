import type { Readable } from "node:stream";
import type { UploadOptions, SignedUrlOptions } from "../types";

export interface StorageProvider {
  upload(key: string, body: Buffer, options: UploadOptions): Promise<string>;
  download(key: string): Promise<Buffer>;
  createReadStream(key: string): Promise<Readable>;
  getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
