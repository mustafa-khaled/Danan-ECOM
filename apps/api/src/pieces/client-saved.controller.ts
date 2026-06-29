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

@Controller("client/saved")
@UseGuards(ClientGuard)
export class ClientSavedController {
  constructor(private readonly pieces: PiecesService) {}

  @Get()
  list(@CurrentClient() client: ClientSession) {
    return this.pieces.getSavedPieces(client.clientId);
  }

  @Post(":pieceId")
  save(
    @CurrentClient() client: ClientSession,
    @Param("pieceId") pieceId: string,
  ) {
    return this.pieces.savePiece(client.clientId, pieceId);
  }

  @Delete(":pieceId")
  unsave(
    @CurrentClient() client: ClientSession,
    @Param("pieceId") pieceId: string,
  ) {
    return this.pieces.unsavePiece(client.clientId, pieceId);
  }
}
