import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class RegisterPieceDto {
  @IsUUID() collectionId!: string;
  @IsString() @MaxLength(200) name!: string;
  @IsString() @MinLength(1) @MaxLength(200) nameAr!: string;
  @IsString() @MaxLength(128) @Matches(/^[a-z0-9-]+$/, { message: "slug must contain only lowercase letters, numbers, and hyphens" }) slug!: string;
  @IsString() @MinLength(1) @MaxLength(10000) story!: string;
  @IsString() @MinLength(1) @MaxLength(10000) storyAr!: string;
  @IsString() @MaxLength(200) material!: string;
  @IsOptional() @IsString() @MaxLength(200) materialAr?: string;
  @IsNumber() @IsPositive() weight!: number;
  @IsString() @MaxLength(200) dimensions!: string;
  @IsOptional() @IsString() @MaxLength(200) dimensionsAr?: string;
  @IsNumber() @Min(0) price!: number;
  @IsOptional() @IsString() @MaxLength(8) currency?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsUUID() initialClientId?: string;
}
