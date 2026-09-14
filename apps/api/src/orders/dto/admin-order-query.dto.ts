import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { OrderStatus, PaymentStatus } from "@dadan/db";
import { AdminListQueryDto } from "../../common/dto/admin-list-query.dto";

export class AdminOrderQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;
}
