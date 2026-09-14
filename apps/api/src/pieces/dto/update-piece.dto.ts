import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";
import { PieceStatus } from "@dadan/db";

export class UpdatePieceDto {
  @IsOptional() @IsEnum(PieceStatus) status?: PieceStatus;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(200) nameAr?: string;
  @IsOptional() @IsString() @MaxLength(128) slug?: string;
  @IsOptional() @IsString() @MaxLength(64) collectionId?: string;
  @IsOptional() @IsString() @MaxLength(10000) story?: string;
  @IsOptional() @IsString() @MaxLength(10000) storyAr?: string;
  @IsOptional() @IsString() @MaxLength(200) material?: string;
  @IsOptional() @IsString() @MaxLength(200) materialAr?: string;
  @IsOptional() @IsNumber() weight?: number;
  @IsOptional() @IsString() @MaxLength(200) dimensions?: string;
  @IsOptional() @IsString() @MaxLength(200) dimensionsAr?: string;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsString() @MaxLength(8) currency?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
