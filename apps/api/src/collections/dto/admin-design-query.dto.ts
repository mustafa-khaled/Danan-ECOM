import { IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../common/dto/pagination.dto";

export class AdminDesignQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  collectionId?: string;
}
