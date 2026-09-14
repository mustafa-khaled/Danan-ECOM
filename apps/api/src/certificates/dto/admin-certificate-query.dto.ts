import { Transform } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";
import { AdminListQueryDto } from "../../common/dto/admin-list-query.dto";

export class AdminCertificateQueryDto extends AdminListQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;
}
