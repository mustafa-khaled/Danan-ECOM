import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class RegisterPieceDto {
  @IsUUID() collectionId!: string;
  @IsString() @MaxLength(200) name!: string;
  @IsString() @MinLength(1) @MaxLength(200) nameAr!: string;
  @IsString() @MaxLength(128) slug!: string;
  @IsString() @MinLength(1) @MaxLength(10000) story!: string;
  @IsString() @MinLength(1) @MaxLength(10000) storyAr!: string;
  @IsString() @MaxLength(200) material!: string;
  @IsOptional() @IsString() @MaxLength(200) materialAr?: string;
  @IsNumber() weight!: number;
  @IsString() @MaxLength(200) dimensions!: string;
  @IsOptional() @IsString() @MaxLength(200) dimensionsAr?: string;
  @IsNumber() price!: number;
  @IsOptional() @IsString() @MaxLength(8) currency?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsUUID() initialClientId?: string;
}
