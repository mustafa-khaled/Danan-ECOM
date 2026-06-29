import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import {
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import type { ShippingAddress } from "@dadan/types";
import { CartService } from "./cart.service";
import { ClientGuard } from "../auth/guards/client.guard";
import { CurrentClient } from "../auth/decorators/current-client.decorator";
import type { ClientSession } from "@dadan/types";

class ShippingAddressDto implements ShippingAddress {
  @IsString() fullName!: string;
  @IsString() line1!: string;
  @IsOptional() @IsString() line2?: string;
  @IsString() city!: string;
  @IsString() region!: string;
  @IsString() country!: string;
  @IsString() postalCode!: string;
  @IsString() phone!: string;
}

class CheckoutDto {
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;

  @IsEnum(["CARD", "MADA", "APPLE_PAY"] as const)
  paymentMethod!: "CARD" | "MADA" | "APPLE_PAY";

  @IsString()
  paymentToken!: string;
}

@Controller("client/checkout")
@UseGuards(ClientGuard)
export class CheckoutController {
  constructor(private readonly cart: CartService) {}

  @Post()
  checkout(
    @CurrentClient() client: ClientSession,
    @Body() dto: CheckoutDto,
  ) {
    return this.cart.checkout(client.clientId, dto);
  }
}
