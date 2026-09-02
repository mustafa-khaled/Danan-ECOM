import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { AcquisitionType } from "@dadan/db";

export class AssignPieceDto {
  @IsUUID() clientId!: string;
  @IsOptional() @IsEnum(AcquisitionType) acquisitionType?: AcquisitionType;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
