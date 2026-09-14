import { IsEnum, IsOptional } from "class-validator";
import { VerificationResult } from "@dadan/db";
import { AdminListQueryDto } from "../../common/dto/admin-list-query.dto";

export class AdminVerificationLogQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsEnum(VerificationResult)
  result?: VerificationResult;
}
