import {
  Controller,
  Get,
  Header,
  Param,
  Res,
  StreamableFile,
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
    @Param("pieceId") pieceId: string,
  ) {
    return this.certificates.getClientCertificate(client.clientId, pieceId);
  }

  @Get("download")
  @Header("Content-Type", "application/pdf")
  async download(
    @CurrentClient() client: ClientSession,
    @Param("pieceId") pieceId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const buffer = await this.certificates.downloadCertificate(
      client.clientId,
      pieceId,
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="certificate-${pieceId}.pdf"`,
    );
    return new StreamableFile(buffer);
  }
}
