import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { AdminRole } from "@dadan/db";

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string;

  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
