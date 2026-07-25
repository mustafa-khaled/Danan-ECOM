import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { PiecesService } from "./pieces.service";
import { ClientGuard } from "../auth/guards/client.guard";
import { CurrentClient } from "../auth/decorators/current-client.decorator";
import { CurrentLocale } from "../common/i18n/locale";
import type { ClientSession, Locale } from "@dadan/types";

@Controller("client/saved")
@UseGuards(ClientGuard)
export class ClientSavedController {
  constructor(private readonly pieces: PiecesService) {}

  @Get()
  list(
    @CurrentClient() client: ClientSession,
    @CurrentLocale() locale: Locale,
  ) {
    return this.pieces.getSavedPieces(client.clientId, locale);
  }

  @Post(":pieceId")
  save(
    @CurrentClient() client: ClientSession,
    @Param("pieceId") pieceId: string,
  ) {
    return this.pieces.savePiece(client.clientId, client.visibilityGroups, pieceId);
  }

  @Delete(":pieceId")
  unsave(
    @CurrentClient() client: ClientSession,
    @Param("pieceId") pieceId: string,
  ) {
    return this.pieces.unsavePiece(client.clientId, pieceId);
  }
}
