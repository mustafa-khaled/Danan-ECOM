import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { IsString } from "class-validator";
import { CartService } from "./cart.service";
import { ClientGuard } from "../auth/guards/client.guard";
import { CurrentClient } from "../auth/decorators/current-client.decorator";
import { CurrentLocale } from "../common/i18n/locale";
import type { ClientSession, Locale } from "@dadan/types";

class AddToCartDto {
  @IsString()
  pieceId!: string;
}

@Controller("client/cart")
@UseGuards(ClientGuard)
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  getCart(
    @CurrentClient() client: ClientSession,
    @CurrentLocale() locale: Locale,
  ) {
    return this.cart.getCart(client.clientId, locale);
  }

  @Post()
  addToCart(
    @CurrentClient() client: ClientSession,
    @CurrentLocale() locale: Locale,
    @Body() dto: AddToCartDto,
  ) {
    return this.cart.addToCart(
      client.clientId,
      client.visibilityGroups,
      dto.pieceId,
      locale,
    );
  }

  @Delete(":pieceId")
  removeFromCart(
    @CurrentClient() client: ClientSession,
    @Param("pieceId") pieceId: string,
  ) {
    return this.cart.removeFromCart(client.clientId, pieceId);
  }
}
