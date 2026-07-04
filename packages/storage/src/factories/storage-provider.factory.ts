import type { StorageConfig } from "../types";
import type { StorageProvider } from "../interfaces/storage-provider.interface";
import { LocalStorageProvider } from "../providers/local-storage.provider";

export function createStorageProvider(config?: Partial<StorageConfig>): StorageProvider {
  const provider = config?.provider ?? process.env.STORAGE_PROVIDER ?? "local";

  switch (provider) {
    case "local": {
      const root = config?.localPath ?? process.env.STORAGE_LOCAL_PATH ?? "/app/uploads";
      return new LocalStorageProvider(root);
    }

    case "s3":
    case "r2":
    case "hetzner":
      throw new Error(
        `Storage provider "${provider}" is not implemented. ` +
        "Use STORAGE_PROVIDER=local for local filesystem storage, " +
        "or implement S3StorageProvider.",
      );

    default:
      throw new Error(`Unknown storage provider: "${provider}"`);
  }
}
