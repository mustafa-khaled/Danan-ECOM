import { IsEnum, IsOptional, IsString } from "class-validator";
import { PieceStatus } from "@dadan/db";

export class UpdatePieceDto {
  @IsOptional() @IsEnum(PieceStatus) status?: PieceStatus;
  @IsOptional() @IsString() notes?: string;
}
