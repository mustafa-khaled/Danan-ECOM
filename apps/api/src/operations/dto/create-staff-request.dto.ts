import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { StaffRequestType } from "@dadan/db";

export class CreateStaffRequestDto {
  @IsEnum(StaffRequestType)
  type!: StaffRequestType;

  @IsUUID()
  clientId!: string;

  @IsOptional()
  @IsUUID()
  targetClassId?: string;

  @IsOptional()
  @IsUUID()
  collectionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
