import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Redirect,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { CertificatesService } from "./certificates.service";
import { ClientGuard } from "../auth/guards/client.guard";
import { CurrentClient } from "../auth/decorators/current-client.decorator";
import type { ClientSession } from "@dadan/types";

@Controller("client/wardrobe/:pieceId/certificate")
@UseGuards(ClientGuard)
export class ClientCertificatesController {
  constructor(private readonly certificates: CertificatesService) {}

  @Get()
  getCertificate(
    @CurrentClient() client: ClientSession,
    @Param("pieceId", ParseUUIDPipe) pieceId: string,
  ) {
    return this.certificates.getClientCertificate(client.clientId, pieceId);
  }

  /**
   * The verification QR as a PNG, so the client modal can render a scannable
   * code instead of only describing one.
   *
   * Written straight to the response rather than returned, because Nest
   * serialises a returned Buffer as `{"type":"Buffer","data":[…]}` — the same
   * direct-write approach UploadsController uses for binary bodies. Ownership
   * is still enforced inside the service before any bytes are produced.
   */
  @Get("qr")
  async qr(
    @CurrentClient() client: ClientSession,
    @Param("pieceId", ParseUUIDPipe) pieceId: string,
    @Res() res: Response,
  ): Promise<void> {
    const png = await this.certificates.getCertificateQrPng(
      client.clientId,
      pieceId,
    );

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Length", png.length);
    // Per-owner document: never retained by a shared cache.
    res.setHeader("Cache-Control", "private, no-store");
    res.end(png);
  }

  @Get("download")
  @Redirect(undefined, 302)
  async download(
    @CurrentClient() client: ClientSession,
    @Param("pieceId", ParseUUIDPipe) pieceId: string,
  ) {
    const url = await this.certificates.getCertificateDownloadUrl(
      client.clientId,
      pieceId,
    );
    return { url };
  }
}
