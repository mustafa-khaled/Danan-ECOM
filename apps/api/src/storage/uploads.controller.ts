import {
  Controller,
  Get,
  Param,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { storage } from "@dadan/storage";

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
