import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { PiecesService } from "./pieces.service";
import { ClientGuard } from "../auth/guards/client.guard";
import { CurrentClient } from "../auth/decorators/current-client.decorator";
import { CurrentLocale } from "../common/i18n/locale";
import type { ClientSession, Locale } from "@dadan/types";

@Controller("client/wardrobe")
@UseGuards(ClientGuard)
export class ClientWardrobeController {
  constructor(private readonly pieces: PiecesService) {}

  @Get()
  list(
    @CurrentClient() client: ClientSession,
    @CurrentLocale() locale: Locale,
    @Query("limit") limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.pieces.getWardrobe(client.clientId, locale, limitNum);
  }

  @Get("my-collection")
  getMyCollection(
    @CurrentClient() client: ClientSession,
    @CurrentLocale() locale: Locale,
  ) {
    return this.pieces.getMyCollection(client.clientId, locale);
  }

  @Get(":pieceId")
  getOne(
    @CurrentClient() client: ClientSession,
    @CurrentLocale() locale: Locale,
    @Param("pieceId") pieceId: string,
  ) {
    return this.pieces.getWardrobePiece(client.clientId, pieceId, locale);
  }
}
