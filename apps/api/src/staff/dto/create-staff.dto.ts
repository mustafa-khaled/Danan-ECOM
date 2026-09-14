import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from "class-validator";
import { AdminRole } from "@dadan/db";

export class CreateStaffDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName!: string;

  @IsEnum(AdminRole)
  role!: AdminRole;
}
