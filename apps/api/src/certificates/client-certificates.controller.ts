import {
  Controller,
  Get,
  Param,
  Redirect,
  UseGuards,
} from "@nestjs/common";
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
  @Redirect(undefined, 302)
  async download(
    @CurrentClient() client: ClientSession,
    @Param("pieceId") pieceId: string,
  ) {
    const url = await this.certificates.getCertificateDownloadUrl(
      client.clientId,
      pieceId,
    );
    return { url };
  }
}
