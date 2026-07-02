import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "node:stream";
import {
  ALLOWED_IMAGE_MIMES,
  ALLOWED_PDF_MIME,
  DEFAULT_MAX_IMAGE_BYTES,
  DEFAULT_MAX_PDF_BYTES,
  DEFAULT_SIGNED_URL_EXPIRY,
  type StorageConfig,
  type UploadOptions,
  type SignedUrlOptions,
} from "./types";

let client: S3Client | null = null;
let bucket = "";

function isR2Endpoint(endpoint: string): boolean {
  return endpoint.includes(".r2.cloudflarestorage.com");
}

function getClient(config?: StorageConfig): { s3: S3Client; bucket: string } {
  if (client && bucket) {
    return { s3: client, bucket };
  }

  const endpoint = config?.endpoint ?? process.env.S3_ENDPOINT ?? "";
  const r2 = isR2Endpoint(endpoint);

  const cfg: StorageConfig = config ?? {
    endpoint: endpoint || "https://localhost",
    bucket: process.env.S3_BUCKET ?? "dadan-assets",
    accessKey: process.env.S3_ACCESS_KEY ?? "",
    secretKey: process.env.S3_SECRET_KEY ?? "",
    region: process.env.S3_REGION ?? (r2 ? "auto" : "us-east-1"),
  };

  bucket = cfg.bucket;
  client = new S3Client({
    endpoint: cfg.endpoint,
    region: cfg.region ?? (r2 ? "auto" : "us-east-1"),
    credentials: {
      accessKeyId: cfg.accessKey,
      secretAccessKey: cfg.secretKey,
    },
    forcePathStyle: !r2,
  });

  return { s3: client, bucket };
}

function validateUpload(contentType: string, size: number, maxBytes?: number): void {
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

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export function createStorage(config?: StorageConfig) {
  return {
    async upload(key: string, body: Buffer, options: UploadOptions): Promise<string> {
      validateUpload(options.contentType, body.length, options.maxBytes);
      const { s3, bucket: b } = getClient(config);

      await s3.send(
        new PutObjectCommand({
          Bucket: b,
          Key: key,
          Body: body,
          ContentType: options.contentType,
        }),
      );

      return key;
    },

    async download(key: string): Promise<Buffer> {
      const { s3, bucket: b } = getClient(config);
      const response = await s3.send(
        new GetObjectCommand({ Bucket: b, Key: key }),
      );

      if (!response.Body) {
        throw new Error("Object not found");
      }

      return streamToBuffer(response.Body as Readable);
    },

    async getSignedUrl(key: string, options: SignedUrlOptions = {}): Promise<string> {
      const { s3, bucket: b } = getClient(config);
      const expiresIn = options.expiresInSeconds ?? DEFAULT_SIGNED_URL_EXPIRY;

      return getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: b, Key: key }),
        { expiresIn },
      );
    },

    async delete(key: string): Promise<void> {
      const { s3, bucket: b } = getClient(config);
      await s3.send(new DeleteObjectCommand({ Bucket: b, Key: key }));
    },

    async exists(key: string): Promise<boolean> {
      const { s3, bucket: b } = getClient(config);
      try {
        await s3.send(new HeadObjectCommand({ Bucket: b, Key: key }));
        return true;
      } catch {
        return false;
      }
    },
  };
}

export const storage = createStorage();
