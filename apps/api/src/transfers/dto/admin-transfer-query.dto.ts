import { IsEnum, IsOptional } from "class-validator";
import { TransferStatus } from "@dadan/db";
import { PaginationQueryDto } from "../../common/dto/pagination.dto";

export class AdminTransferQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(TransferStatus)
  status?: TransferStatus;
}
