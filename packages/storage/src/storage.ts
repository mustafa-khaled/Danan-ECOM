import type { StorageConfig } from "./types";
import { createStorageProvider } from "./factories/storage-provider.factory";

export function createStorage(config?: Partial<StorageConfig>) {
  return createStorageProvider(config);
}

export const storage = createStorage();
