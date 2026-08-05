import { createReadStream, existsSync, mkdirSync, constants } from "node:fs";
import { access, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join, normalize, resolve, sep } from "node:path";
import type { Readable } from "node:stream";
import { validateUpload, validateMagicBytes } from "../validation";
import type { StorageProvider } from "../interfaces/storage-provider.interface";
import type { UploadOptions, SignedUrlOptions } from "../types";

const PUBLIC_URL_PREFIX = "/api/uploads";

export class LocalStorageProvider implements StorageProvider {
  private readonly root: string;
  private readonly publicUrlPrefix: string;

  constructor(root: string, publicUrlPrefix: string = PUBLIC_URL_PREFIX) {
    this.root = resolve(root);
    this.publicUrlPrefix = publicUrlPrefix;
    this.ensureDirectory(this.root);
  }

  private resolvePath(key: string): string {
    const normalized = normalize("/" + key).replace(/^[/\\]+/, "");
    const fullPath = resolve(join(this.root, normalized));

    if (!fullPath.startsWith(this.root + sep)) {
      throw new Error("Path traversal detected in storage key");
    }

    return fullPath;
  }

  private ensureDirectory(dir: string): void {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  private async ensureParentDirectory(filePath: string): Promise<void> {
    const parentDir = this.dirname(filePath);
    await mkdir(parentDir, { recursive: true });
  }

  private dirname(p: string): string {
    const idx = p.lastIndexOf(sep);
    return idx === -1 ? this.root : p.slice(0, idx);
  }

  async upload(key: string, body: Buffer, options: UploadOptions): Promise<string> {
    validateUpload(options.contentType, body.length, options.maxBytes);
    await validateMagicBytes(body, options.contentType);
    const fullPath = this.resolvePath(key);
    await this.ensureParentDirectory(fullPath);
    await writeFile(fullPath, body);
    return key;
  }

  async download(key: string): Promise<Buffer> {
    const fullPath = this.resolvePath(key);
    return readFile(fullPath);
  }

  async createReadStream(key: string): Promise<Readable> {
    const fullPath = this.resolvePath(key);
    return createReadStream(fullPath);
  }

  async getSignedUrl(key: string, _options?: SignedUrlOptions): Promise<string> {
    const safeKey = normalize("/" + key).replace(/^[/\\]+/, "");
    return `${this.publicUrlPrefix}/${safeKey}`;
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.resolvePath(key);
    await unlink(fullPath);
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fullPath = this.resolvePath(key);
      await access(fullPath, constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  async removeAll(): Promise<void> {
    if (!existsSync(this.root)) {
      return;
    }
    const { readdir, rm } = await import("node:fs/promises");
    const entries = await readdir(this.root);
    await Promise.all(
      entries.map((entry) => rm(join(this.root, entry), { recursive: true, force: true })),
    );
  }
}
