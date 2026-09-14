import { IsIn, IsOptional } from "class-validator";

export class AnalyticsQueryDto {
  @IsOptional()
  @IsIn(["30d", "12m"])
  period?: "30d" | "12m";
}
