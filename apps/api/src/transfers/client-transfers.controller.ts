import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { IsEnum, IsString, MinLength } from "class-validator";
import { TransferType } from "@dadan/db";
import type { Request } from "express";
import { TransfersService } from "./transfers.service";
import { ClientGuard } from "../auth/guards/client.guard";
import { CurrentClient } from "../auth/decorators/current-client.decorator";
import type { ClientSession } from "@dadan/types";
import { getClientIp } from "../common/constants";

class InitiateTransferDto {
  @IsString()
  pieceId!: string;

  @IsEnum(TransferType)
  transferType!: TransferType;

  @IsString()
  @MinLength(1)
  recipientHouseKey!: string;
}

@Controller("client/transfers")
@UseGuards(ClientGuard)
export class ClientTransfersController {
  constructor(private readonly transfers: TransfersService) {}

  @Post("initiate")
  initiate(
    @CurrentClient() client: ClientSession,
    @Body() dto: InitiateTransferDto,
    @Req() req: Request,
  ) {
    return this.transfers.initiate(client.clientId, dto, getClientIp(req));
  }

  @Post(":transferId/confirm-sender")
  confirmSender(
    @CurrentClient() client: ClientSession,
    @Param("transferId") transferId: string,
    @Req() req: Request,
  ) {
    return this.transfers.confirmSender(transferId, client.clientId, getClientIp(req));
  }

  @Post(":transferId/confirm-recipient")
  confirmRecipient(
    @CurrentClient() client: ClientSession,
    @Param("transferId") transferId: string,
    @Req() req: Request,
  ) {
    return this.transfers.confirmRecipient(transferId, client.clientId, getClientIp(req));
  }

  @Post(":transferId/cancel")
  cancel(
    @CurrentClient() client: ClientSession,
    @Param("transferId") transferId: string,
    @Req() req: Request,
  ) {
    return this.transfers.cancel(transferId, client.clientId, getClientIp(req));
  }

  @Get()
  list(@CurrentClient() client: ClientSession) {
    return this.transfers.listClientTransfers(client.clientId);
  }

  @Get(":transferId")
  getOne(
    @CurrentClient() client: ClientSession,
    @Param("transferId") transferId: string,
  ) {
    return this.transfers.getClientTransfer(transferId, client.clientId);
  }
}
