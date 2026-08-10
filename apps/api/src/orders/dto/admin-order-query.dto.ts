import { IsEnum, IsOptional, IsString } from "class-validator";
import { OrderStatus } from "@dadan/db";
import { PaginationQueryDto } from "../../common/dto/pagination.dto";

export class AdminOrderQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  clientId?: string;
}
