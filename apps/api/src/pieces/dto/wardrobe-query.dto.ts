import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class WardrobeQueryDto {
  /**
   * Caps how many pieces the wardrobe returns. Bounded so the value cannot be
   * used to ask for an arbitrarily large response.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
