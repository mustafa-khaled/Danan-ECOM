import { IsEnum } from "class-validator";
import { OrderStatus } from "@dadan/db";

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
