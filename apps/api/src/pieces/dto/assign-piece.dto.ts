import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { AcquisitionType } from "@dadan/db";

export class AssignPieceDto {
  @IsUUID() clientId!: string;
  @IsOptional() @IsEnum(AcquisitionType) acquisitionType?: AcquisitionType;
  @IsOptional() @IsString() notes?: string;
}
