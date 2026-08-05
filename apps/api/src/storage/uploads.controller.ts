import {
  Controller,
  Get,
  Req,
  Res,
} from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { storage } from "@dadan/storage";
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

// Image-heavy pages fetch many assets at once; the global IP throttle would
// starve legitimate gallery loads.
@Public()
@SkipThrottle()
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

    try {
      const stream = await storage.createReadStream(storageKey);
      const contentType = mimeFromKey(storageKey);

      res.setHeader("Content-Type", contentType);

      // Seed-managed assets live under <entity>/seed/<file> and share
      // deterministic filenames across re-seeds while their content can
      // change, so never cache them as immutable. Real user uploads are
      // immutable and safe to cache for a year.
      const cacheControl = storageKey.split("/").includes("seed")
        ? "public, max-age=0, must-revalidate"
        : "public, max-age=31536000, immutable";
      res.setHeader("Cache-Control", cacheControl);

      stream.on("error", () => {
        if (!res.headersSent) res.sendStatus(404);
      });

      stream.pipe(res);
    } catch {
      if (!res.headersSent) res.sendStatus(404);
    }
  }
}
