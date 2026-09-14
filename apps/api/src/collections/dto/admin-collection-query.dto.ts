import { Transform } from "class-transformer";
import { IsBoolean, IsIn, IsOptional, IsUUID } from "class-validator";
import { AdminListQueryDto } from "../../common/dto/admin-list-query.dto";

export class AdminCollectionQueryDto extends AdminListQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  })
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsIn(["updatedAt", "sortOrder", "name"])
  declare sortBy?: "updatedAt" | "sortOrder" | "name";
}
