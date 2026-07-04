# Storage Layer Redesign

## Architecture Overview

The storage layer has been redesigned from a tightly-coupled AWS S3 (Cloudflare R2) client to a **Strategy Pattern** (Provider Pattern) architecture. The public API is unchanged — every consumer importing `{ storage }` from `@dadan/storage` continues to work without modification.

```
┌─────────────────────────────────────────────────────┐
│                    Consumers                         │
│  (collections.service, certificates.service, etc.)   │
│         import { storage } from "@dadan/storage"     │
└──────────────────────┬──────────────────────────────┘
                       │  upload / download / getSignedUrl
                       │  delete / exists / createReadStream
                       ▼
┌──────────────────────────────────────────────────────┐
│               StorageProvider (interface)             │
│  packages/storage/src/interfaces/                    │
│  storage-provider.interface.ts                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────────┐   ┌──────────────────────┐  │
│  │ LocalStorageProvider │   │ S3StorageProvider    │  │
│  │ (implemented)        │   │ (future)             │  │
│  │ packages/storage/    │   │ packages/storage/    │  │
│  │ providers/           │   │ providers/           │  │
│  └──────────┬───────────┘   └──────────────────────┘  │
│             │                                          │
│  ┌──────────▼──────────────────────────────────────┐   │
│  │       StorageProviderFactory                     │   │
│  │  packages/storage/factories/                    │   │
│  │  Selects provider from STORAGE_PROVIDER env      │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

---

## Package Structure

```
packages/storage/src/
├── index.ts                                    # Barrel exports
├── types.ts                                    # Config, options, constants
├── keys.ts                                     # Key generation helpers (unchanged)
├── validation.ts                               # MIME/size validation (extracted)
├── storage.ts                                  # Exports `storage` singleton + `createStorage`
├── interfaces/
│   └── storage-provider.interface.ts           # StorageProvider contract
├── providers/
│   └── local-storage.provider.ts               # Local filesystem provider
└── factories/
    └── storage-provider.factory.ts             # Provider factory
```

---

## Files Changed

### New Files

| File                                                            | Purpose                                     |
| --------------------------------------------------------------- | ------------------------------------------- |
| `packages/storage/src/interfaces/storage-provider.interface.ts` | Strategy interface                          |
| `packages/storage/src/providers/local-storage.provider.ts`      | Local filesystem implementation             |
| `packages/storage/src/factories/storage-provider.factory.ts`    | Factory — selects provider from environment |
| `packages/storage/src/validation.ts`                            | Extracted MIME/size validation logic        |
| `apps/api/src/storage/uploads.controller.ts`                    | Serves uploaded files via HTTP              |

### Modified Files

| File                                     | Change                                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| `packages/storage/src/types.ts`          | `StorageConfig` now supports `provider`, `localPath`, `forcePathStyle`; all fields optional |
| `packages/storage/src/storage.ts`        | Gutted from 139 lines of S3 code to 8 lines — delegates to factory                          |
| `packages/storage/src/index.ts`          | Added exports: `StorageProvider` type, `createStorageProvider` factory                      |
| `packages/storage/package.json`          | Removed `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` dependencies                  |
| `apps/api/src/storage/storage.module.ts` | Registered `UploadsController`                                                              |
| `apps/api/src/config/env.validation.ts`  | Replaced required S3 vars with `STORAGE_PROVIDER` + `STORAGE_LOCAL_PATH`; S3 vars optional  |
| `docker-compose.prod.yml`                | Replaced `S3_*` env block with `STORAGE_PROVIDER` + `STORAGE_LOCAL_PATH`                    |
| `.env.example` / `.env`                  | Replaced S3 block with `STORAGE_PROVIDER=local` / `STORAGE_LOCAL_PATH=/app/uploads`         |
| `packages/db/prisma/seed-assets.ts`      | Renamed `seedR2Placeholders` → `seedPlaceholders`; updated env guard                        |
| `packages/db/prisma/seed.ts`             | Updated import/function call to `seedPlaceholders`                                          |

### Unchanged Files

| File                                      | Why                                                           |
| ----------------------------------------- | ------------------------------------------------------------- |
| `packages/storage/src/keys.ts`            | Key helpers (`designImageKey`, `extFromMime`, etc.) unchanged |
| `apps/api/src/storage/storage.service.ts` | Public API unchanged — still delegates to `storage` singleton |
| `apps/api/src/app.module.ts`              | `StorageModule` import unchanged                              |
| All controllers, DTOs, Prisma schema      | Zero changes                                                  |

---

## StorageProvider Interface

```ts
// packages/storage/src/interfaces/storage-provider.interface.ts

interface StorageProvider {
  upload(key: string, body: Buffer, options: UploadOptions): Promise<string>;
  download(key: string): Promise<Buffer>;
  createReadStream(key: string): Promise<Readable>;
  getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
```

The first five methods match the existing API exactly (preserved for backward compatibility). `createReadStream` is new — it enables streaming file downloads without loading the entire file into memory.

---

## LocalStorageProvider

### File Serving

`LocalStorageProvider.getSignedUrl()` returns URLs in the format:

```
/api/uploads/{key}
```

These are relative URLs resolved by the browser against the current origin. Examples:

```
/api/uploads/designs/abc123/def456.jpg
/api/uploads/collections/col789/cover.webp
/api/uploads/certificates/cert001.pdf
```

The URL prefix `/api/uploads` is configurable via the constructor `publicUrlPrefix` parameter.

### How Requests Flow

```
Browser
  │  GET /api/uploads/designs/abc123/def456.jpg
  ▼
nginx
  │  location ^~ /api/  →  proxy_pass http://api_app/
  │  strips /api/, forwards:  GET /uploads/designs/abc123/def456.jpg
  ▼
UploadsController  (@Controller("uploads"))
  │  @Get(":key(*)")  →  key = "designs/abc123/def456.jpg"
  │  storage.createReadStream(key)
  │  fs.createReadStream(/app/uploads/designs/abc123/def456.jpg)
  │  pipes response with correct Content-Type
  ▼
Browser receives file
```

### URL Strategy Rationale

Two options were considered:

| Approach                      | Pros                                                                                                                         | Cons                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `/api/uploads/{key}` (chosen) | Goes through NestJS pipeline; consistent with existing routing; no nginx config changes; auth middleware available if needed | Slightly higher latency than direct nginx serving                                      |
| `/uploads/{key}`              | Could be served directly by nginx (static files)                                                                             | Requires nginx config change; bypasses API pipeline; not needed for current deployment |

`/api/uploads/{key}` was chosen because:

- Nginx already routes `/api/*` to the API — zero nginx config changes
- Consistent with every other API route
- For production optimization, a future nginx `location /uploads/` can be added to serve files directly from `/app/uploads` without touching application code

### Path Traversal Security

Every key is sanitized before filesystem access:

```ts
private resolvePath(key: string): string {
  const normalized = normalize("/" + key).replace(/^[/\\]+/, "");
  const fullPath = resolve(join(this.root, normalized));

  if (!fullPath.startsWith(this.root + sep)) {
    throw new Error("Path traversal detected in storage key");
  }

  return fullPath;
}
```

This protects against:

- `../` traversal: `key = "../../etc/passwd"` → resolved path doesn't start with `/app/uploads/` → rejected
- Absolute paths: `key = "/etc/passwd"` → normalized to `etc/passwd` → joined with root → still contained
- URL-encoded traversal: Express decodes `%2e%2e%2f` → `../` → caught by root check
- Windows-style traversal: `key = "..\\..\\etc\\passwd"` → `normalize` handles all separators
- Double encoding: `%252e%252e%252f` → Express decodes once → `%2e%2e%2f` → not `../` → doesn't traverse, file won't exist (harmless)

### Content-Type Detection

The controller maps extensions to MIME types:

```
.jpg / .jpeg → image/jpeg
.png         → image/png
.webp        → image/webp
.pdf         → application/pdf
else         → application/octet-stream
```

### Caching

Files are served with `Cache-Control: public, max-age=31536000, immutable` since generated storage keys are content-addressable (a different file = a different key). Browsers and CDNs can cache aggressively.

---

## Configuration

### Environment Variables

| Variable             | Required | Default        | Description                                 |
| -------------------- | -------- | -------------- | ------------------------------------------- |
| `STORAGE_PROVIDER`   | No       | `local`        | Provider: `local`, `s3`, `r2`, or `hetzner` |
| `STORAGE_LOCAL_PATH` | No       | `/app/uploads` | Root directory for local storage            |

### Replaced Variables

| Old Variable    | Status                                            |
| --------------- | ------------------------------------------------- |
| `S3_ENDPOINT`   | Optional — used by future S3/R2/Hetzner providers |
| `S3_BUCKET`     | Optional                                          |
| `S3_ACCESS_KEY` | Optional                                          |
| `S3_SECRET_KEY` | Optional                                          |
| `S3_REGION`     | Optional                                          |

The S3 variables are retained as optional in `env.validation.ts` so they're available when a remote provider is implemented. They no longer fail validation when absent.

### Minimal `.env` for Local Development

```env
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=/app/uploads
```

---

## Docker Implications

### Volume Mount (Already Configured)

```yaml
# docker-compose.prod.yml — unchanged
volumes:
  - /opt/dadan/data/uploads:/app/uploads
```

The Docker container already mounts the host directory to `/app/uploads` inside the API container. No changes needed.

### Environment Variables

```yaml
# docker-compose.prod.yml — updated
environment:
  STORAGE_PROVIDER: ${STORAGE_PROVIDER:-local}
  STORAGE_LOCAL_PATH: ${STORAGE_LOCAL_PATH:-/app/uploads}
```

The old S3 env block has been replaced. Sensible defaults make the API start without any storage configuration.

### Host Setup

Ensure the uploads directory exists and has correct permissions:

```sh
mkdir -p /opt/dadan/data/uploads
chown 1001:1001 /opt/dadan/data/uploads   # matches the nestjs user (uid 1001) in the container
```

---

## Migration Strategy: Local → Hetzner Object Storage

Hetzner Object Storage is S3-compatible. The migration requires three steps:

### 1. Implement S3 Compatible Provider

Create `packages/storage/src/providers/s3-compatible.provider.ts`:

```ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "node:stream";
import { validateUpload } from "../validation";
import type { StorageProvider } from "../interfaces/storage-provider.interface";
import type { UploadOptions, SignedUrlOptions } from "../types";
import { DEFAULT_SIGNED_URL_EXPIRY } from "../types";

export class S3CompatibleProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: {
    endpoint: string;
    bucket: string;
    accessKey: string;
    secretKey: string;
    region?: string;
    forcePathStyle?: boolean;
  }) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region ?? "us-east-1",
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: config.forcePathStyle ?? true,
    });
    this.bucket = config.bucket;
  }

  async upload(
    key: string,
    body: Buffer,
    options: UploadOptions,
  ): Promise<string> {
    validateUpload(options.contentType, body.length, options.maxBytes);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: options.contentType,
      }),
    );
    return key;
  }

  async download(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!response.Body) throw new Error("Object not found");
    const chunks: Buffer[] = [];
    for await (const chunk of response.Body as Readable) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async createReadStream(key: string): Promise<Readable> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!response.Body) throw new Error("Object not found");
    return response.Body as Readable;
  }

  async getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    const expiresIn = options?.expiresInSeconds ?? DEFAULT_SIGNED_URL_EXPIRY;
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
```

### 2. Register in Factory

Add to `storage-provider.factory.ts`:

```ts
case "s3":
case "r2":
case "hetzner": {
  const endpoint = config?.endpoint ?? process.env.S3_ENDPOINT ?? "";
  const bucket = config?.bucket ?? process.env.S3_BUCKET ?? "";
  const accessKey = config?.accessKey ?? process.env.S3_ACCESS_KEY ?? "";
  const secretKey = config?.secretKey ?? process.env.S3_SECRET_KEY ?? "";
  const region = config?.region ?? process.env.S3_REGION;
  const forcePathStyle = config?.forcePathStyle;

  if (!endpoint || !bucket || !accessKey || !secretKey) {
    throw new Error(`Missing S3 credentials for provider "${provider}"`);
  }

  const isR2 = endpoint.includes(".r2.cloudflarestorage.com");
  const isHetzner = endpoint.includes(".your-objectstorage.com");

  return new S3CompatibleProvider({
    endpoint,
    bucket,
    accessKey,
    secretKey,
    region: region ?? (isR2 ? "auto" : isHetzner ? "eu-central-1" : "us-east-1"),
    forcePathStyle: forcePathStyle ?? (!isR2 && !isHetzner),
  });
}
```

### 3. Add `@aws-sdk` Dependencies Back

```json
// packages/storage/package.json
"dependencies": {
  "@aws-sdk/client-s3": "^3.750.0",
  "@aws-sdk/s3-request-presigner": "^3.750.0"
}
```

### 4. Configure

```env
STORAGE_PROVIDER=hetzner
S3_ENDPOINT=https://fsn1.your-objectstorage.com
S3_BUCKET=dadan-assets
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_REGION=eu-central-1
```

**Zero application code changes.** The same `storage.upload()`, `storage.download()`, `storage.getSignedUrl()` calls work identically.

---

## Validation (Preserved)

The existing validation logic remains unchanged:

```ts
// packages/storage/src/validation.ts
export function validateUpload(
  contentType: string,
  size: number,
  maxBytes?: number,
): void {
  const isPdf = contentType === ALLOWED_PDF_MIME; // "application/pdf"
  const isImage = ALLOWED_IMAGE_MIMES.has(contentType); // jpeg, png, webp
  if (!isPdf && !isImage) throw new Error("Unsupported file type");

  const limit =
    maxBytes ?? (isPdf ? DEFAULT_MAX_PDF_BYTES : DEFAULT_MAX_IMAGE_BYTES);
  if (size > limit) throw new Error("File exceeds maximum allowed size");
}
```

| Constraint                 | Value                                   |
| -------------------------- | --------------------------------------- |
| Allowed image MIME types   | `image/jpeg`, `image/png`, `image/webp` |
| Allowed document MIME type | `application/pdf`                       |
| Maximum image size         | 10 MB                                   |
| Maximum PDF size           | 20 MB                                   |

---

## SOLID Principles

| Principle                 | Application                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **S**ingle Responsibility | Each file has one concern: interface, implementation, factory, validation, keys                                     |
| **O**pen/Closed           | New providers added by creating a class + registering in factory — existing code closed to modification             |
| **L**iskov Substitution   | Any `StorageProvider` implementation can replace another without changing consumers                                 |
| **I**nterface Segregation | `StorageProvider` has focused methods; consumers depend on the interface, not concrete classes                      |
| **D**ependency Inversion  | High-level consumers depend on the `StorageProvider` abstraction, not `LocalStorageProvider` or `S3StorageProvider` |

---

## Performance

- **Uploads:** Accept `Buffer` (matches what the API already provides via Multer). Written to disk with `fs.promises.writeFile`.
- **Downloads:** `download()` uses `fs.promises.readFile` for in-memory Buffer (used by certificates service for PDF generation).
- **Streaming:** `createReadStream()` uses `fs.createReadStream` — pipes directly to HTTP response without buffering the entire file in memory.
- **Directory creation:** `mkdir({ recursive: true })` ensures parent directories exist on each upload.

---

## Production Readiness Checklist

- [x] Create `/opt/dadan/data/uploads` on VPS
- [x] Set ownership: `chown 1001:1001 /opt/dadan/data/uploads`
- [x] Set `STORAGE_PROVIDER=local` in production `.env`
- [x] Set `STORAGE_LOCAL_PATH=/app/uploads` in production `.env`
- [x] Verify nginx routes `/api/uploads/*` → API (works automatically via existing `/api/` location block)
- [x] Run `pnpm build` to rebuild storage package
- [x] Restart API container
