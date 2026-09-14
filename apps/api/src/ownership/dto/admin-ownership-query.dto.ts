import { IsIn, IsOptional, IsUUID } from "class-validator";
import { AdminListQueryDto } from "../../common/dto/admin-list-query.dto";

export class AdminOwnershipQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsIn(["OWNED", "IN_TRANSFER", "PENDING", "AVAILABLE"])
  status?: "OWNED" | "IN_TRANSFER" | "PENDING" | "AVAILABLE";

  @IsOptional()
  @IsUUID()
  collectionId?: string;
}
