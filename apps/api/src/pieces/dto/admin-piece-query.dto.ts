import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, IsUUID } from "class-validator";
import { PieceStatus } from "@dadan/db";
import { AdminListQueryDto } from "../../common/dto/admin-list-query.dto";

export class AdminPieceQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsUUID()
  collectionId?: string;

  @IsOptional()
  @IsEnum(PieceStatus)
  status?: PieceStatus;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;
}
