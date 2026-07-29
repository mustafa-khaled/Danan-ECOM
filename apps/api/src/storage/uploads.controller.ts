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
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

      stream.on("error", () => {
        if (!res.headersSent) res.sendStatus(404);
      });

      stream.pipe(res);
    } catch {
      if (!res.headersSent) res.sendStatus(404);
    }
  }
}
