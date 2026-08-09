import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { TransferStatus } from "@dadan/db";
import { TransfersService } from "./transfers.service";
import { ClientGuard } from "../auth/guards/client.guard";
import { CurrentClient } from "../auth/decorators/current-client.decorator";
import { CurrentLocale } from "../common/i18n/locale";
import type { ClientSession, Locale } from "@dadan/types";
import { getClientIp } from "../common/constants";
import { InitiateTransferDto } from "./dto/initiate-transfer.dto";

@Controller("client/transfers")
@UseGuards(ClientGuard)
export class ClientTransfersController {
  constructor(private readonly transfers: TransfersService) {}

  @Post("initiate")
  initiate(
    @CurrentClient() client: ClientSession,
    @CurrentLocale() locale: Locale,
    @Body() dto: InitiateTransferDto,
    @Req() req: Request,
  ) {
    return this.transfers.initiate(client.clientId, dto, getClientIp(req), locale);
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
  list(
    @CurrentClient() client: ClientSession,
    @CurrentLocale() locale: Locale,
    @Query("status") status?: TransferStatus,
  ) {
    return this.transfers.listClientTransfers(client.clientId, locale, status);
  }

  @Get(":transferId")
  getOne(
    @CurrentClient() client: ClientSession,
    @CurrentLocale() locale: Locale,
    @Param("transferId") transferId: string,
  ) {
    return this.transfers.getClientTransfer(transferId, client.clientId, locale);
  }
}
