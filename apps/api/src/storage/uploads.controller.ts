import { createHash } from "node:crypto";
import {
  Controller,
  Get,
  Req,
  Res,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { requiresSignature, storage, verifyStorageSignature } from "@dadan/storage";
import { Public } from "../common/decorators/public.decorator";

const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  pdf: "application/pdf",
};

function mimeFromKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TO_MIME[ext] ?? "application/octet-stream";
}

function etagFromStat(key: string, size: number, mtimeMs: number): string {
  const digest = createHash("sha256")
    .update(key)
    .update("\0")
    .update(String(size))
    .update("\0")
    .update(String(mtimeMs))
    .digest("hex")
    .slice(0, 32);
  return `W/"${digest}"`;
}

function ifNoneMatchMatches(header: string | undefined, etag: string): boolean {
  if (!header) return false;
  const expected = etag.replace(/^W\//, "");
  return header
    .split(",")
    .map((token) => token.trim().replace(/^W\//, "").replace(/^"(.*)"$/, "$1"))
    .includes(expected);
}

function ifModifiedSinceFresh(
  header: string | undefined,
  mtimeMs: number,
): boolean {
  if (!header) return false;
  const since = Date.parse(header);
  if (Number.isNaN(since)) return false;
  return Math.floor(mtimeMs / 1000) <= Math.floor(since / 1000);
}

function hasValidSignature(req: Request, storageKey: string): boolean {
  const { exp, sig } = req.query;
  if (typeof exp !== "string" || typeof sig !== "string") return false;
  return verifyStorageSignature(storageKey, Number(exp), sig);
}

// Image-heavy pages fetch many assets at once, so the global 120/min IP
// throttle would starve legitimate gallery loads. This ceiling is well above
// what any real page needs while still bounding a single client streaming
// files in a loop — nginx additionally caps concurrent connections.
@Public()
@Throttle({ default: { limit: 600, ttl: 60_000 } })
@Controller("uploads")
export class UploadsController {
  @Get("*key")
  async serveFile(@Req() req: Request, @Res() res: Response): Promise<void> {
    const storageKey = req.path.replace(/^\/uploads\//, "");

    if (
      !storageKey ||
      storageKey.includes("..") ||
      storageKey.startsWith("/") ||
      storageKey.startsWith("\\") ||
      /[%]2[eE]/i.test(storageKey)
    ) {
      res.sendStatus(400);
      return;
    }

    // Certificates are per-owner documents, so this route cannot serve them on
    // the strength of a guessable key alone. The signature is minted by the
    // authenticated certificate routes, which check ownership first.
    const isPrivate = requiresSignature(storageKey);
    if (isPrivate && !hasValidSignature(req, storageKey)) {
      res.sendStatus(403);
      return;
    }

    try {
      const { size, mtimeMs } = await storage.stat(storageKey);
      const contentType = mimeFromKey(storageKey);
      const etag = etagFromStat(storageKey, size, mtimeMs);

      res.setHeader("Content-Type", contentType);
      res.setHeader("ETag", etag);
      res.setHeader("Last-Modified", new Date(mtimeMs).toUTCString());

      // Seed-managed assets live under <entity>/seed/<file> and share
      // deterministic filenames across re-seeds while their content can
      // change, so never cache them as immutable. Real user uploads are
      // immutable and safe to cache for a year. Private documents must not be
      // retained by shared caches at all.
      const cacheControl = isPrivate
        ? "private, no-store"
        : storageKey.split("/").includes("seed")
          ? "public, max-age=0, must-revalidate"
          : "public, max-age=31536000, immutable";
      res.setHeader("Cache-Control", cacheControl);

      if (ifNoneMatchMatches(req.headers["if-none-match"], etag)) {
        res.status(304).end();
        return;
      }

      if (ifModifiedSinceFresh(req.headers["if-modified-since"], mtimeMs)) {
        res.status(304).end();
        return;
      }

      const stream = await storage.createReadStream(storageKey);

      stream.on("error", () => {
        if (!res.headersSent) res.sendStatus(404);
      });

      stream.pipe(res);
    } catch {
      if (!res.headersSent) res.sendStatus(404);
    }
  }
}
