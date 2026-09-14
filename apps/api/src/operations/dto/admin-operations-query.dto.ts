import { IsIn, IsOptional } from "class-validator";
import { AdminListQueryDto } from "../../common/dto/admin-list-query.dto";

export class AdminOperationsQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsIn(["ACCESS_REQUEST", "PIECE_TRANSFER", "MEMBERSHIP_UPGRADE", "KEY_ISSUANCE"])
  type?: "ACCESS_REQUEST" | "PIECE_TRANSFER" | "MEMBERSHIP_UPGRADE" | "KEY_ISSUANCE";

  @IsOptional()
  @IsIn(["PENDING", "COMPLETED", "UNDER_REVIEW", "REJECTED"])
  status?: "PENDING" | "COMPLETED" | "UNDER_REVIEW" | "REJECTED";
}
