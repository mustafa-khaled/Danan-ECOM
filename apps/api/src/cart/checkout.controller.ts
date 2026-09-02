import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import type { ShippingAddress } from "@dadan/types";
import { CartService } from "./cart.service";
import { ClientGuard } from "../auth/guards/client.guard";
import { CurrentClient } from "../auth/decorators/current-client.decorator";
import type { ClientSession } from "@dadan/types";

class ShippingAddressDto implements ShippingAddress {
  @IsString() @MaxLength(200) fullName!: string;
  @IsString() @MaxLength(200) line1!: string;
  @IsOptional() @IsString() @MaxLength(200) line2?: string;
  @IsString() @MaxLength(100) city!: string;
  @IsString() @MaxLength(100) region!: string;
  @IsString() @MaxLength(100) country!: string;
  @IsString() @MaxLength(20) postalCode!: string;
  @IsString() @MaxLength(32) phone!: string;
}

class CheckoutDto {
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;

  @IsEnum(["CARD", "MADA", "APPLE_PAY"] as const)
  paymentMethod!: "CARD" | "MADA" | "APPLE_PAY";

  @IsString()
  @MinLength(1)
  @MaxLength(512)
  paymentToken!: string;
}

class ConfirmCheckoutDto {
  /** Tap charge id returned as `?tap_id=` on the 3-D Secure redirect. */
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  tapId!: string;
}

@Controller("client/checkout")
@UseGuards(ClientGuard)
export class CheckoutController {
  constructor(private readonly cart: CartService) {}

  @Post("reserve")
  @HttpCode(HttpStatus.OK)
  reserve(@CurrentClient() client: ClientSession) {
    return this.cart.reserveForCheckout(client.clientId, client.visibilityGroups);
  }

  @Post()
  checkout(
    @CurrentClient() client: ClientSession,
    @Body() dto: CheckoutDto,
  ) {
    return this.cart.checkout(client.clientId, client.visibilityGroups, dto);
  }

  @Post("confirm")
  @HttpCode(HttpStatus.OK)
  confirm(
    @CurrentClient() client: ClientSession,
    @Body() dto: ConfirmCheckoutDto,
  ) {
    return this.cart.confirmCheckout(client.clientId, dto.tapId);
  }
}
