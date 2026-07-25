import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { ClientGuard } from "../auth/guards/client.guard";
import { CurrentClient } from "../auth/decorators/current-client.decorator";
import { CurrentLocale } from "../common/i18n/locale";
import type { ClientSession, Locale } from "@dadan/types";

@Controller("client/orders")
@UseGuards(ClientGuard)
export class ClientOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(
    @CurrentClient() client: ClientSession,
    @CurrentLocale() locale: Locale,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.orders.getClientOrders(
      client.clientId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
      locale,
    );
  }

  @Get(":orderId")
  getOne(
    @CurrentClient() client: ClientSession,
    @CurrentLocale() locale: Locale,
    @Param("orderId") orderId: string,
  ) {
    return this.orders.getClientOrder(client.clientId, orderId, locale);
  }

  @Post(":orderId/cancel")
  cancel(
    @CurrentClient() client: ClientSession,
    @Param("orderId") orderId: string,
  ) {
    return this.orders.cancelOrder(client.clientId, orderId);
  }
}
