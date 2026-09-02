import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { PieceStatus } from "@dadan/db";

export class UpdatePieceDto {
  @IsOptional() @IsEnum(PieceStatus) status?: PieceStatus;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
