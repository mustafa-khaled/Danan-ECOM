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
import type { ClientSession } from "@dadan/types";

@Controller("client/wardrobe")
@UseGuards(ClientGuard)
export class ClientWardrobeController {
  constructor(private readonly pieces: PiecesService) {}

  @Get()
  list(@CurrentClient() client: ClientSession) {
    return this.pieces.getWardrobe(client.clientId);
  }

  @Get(":pieceId")
  getOne(
    @CurrentClient() client: ClientSession,
    @Param("pieceId") pieceId: string,
  ) {
    return this.pieces.getWardrobePiece(client.clientId, pieceId);
  }
}
