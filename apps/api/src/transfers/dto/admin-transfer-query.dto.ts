import { IsEnum, IsOptional, IsUUID } from "class-validator";
import { TransferStatus } from "@dadan/db";
import { AdminListQueryDto } from "../../common/dto/admin-list-query.dto";

export class AdminTransferQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsEnum(TransferStatus)
  status?: TransferStatus;

  @IsOptional()
  @IsUUID()
  pieceId?: string;

  @IsOptional()
  @IsUUID()
  fromClientId?: string;
}
