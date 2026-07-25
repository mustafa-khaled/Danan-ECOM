import {
  Controller,
  Get,
  Param,
  Res,
} from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import type { Response } from "express";
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
  async serveFile(@Param("key") key: string, @Res() res: Response): Promise<void> {
    const stream = await storage.createReadStream(key);
    const contentType = mimeFromKey(key);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    stream.pipe(res);
  }
}
