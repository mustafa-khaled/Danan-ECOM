import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateCollectionDto {
  @IsString() @MaxLength(200) name!: string;
  @IsString() @MinLength(1) @MaxLength(200) nameAr!: string;
  @IsString() @MaxLength(128) @Matches(/^[a-z0-9-]+$/, { message: "slug must contain only lowercase letters, numbers, and hyphens" }) slug!: string;
  @IsOptional() @IsString() @MaxLength(10000) description?: string;
  @IsOptional() @IsString() @MaxLength(10000) descriptionAr?: string;
  @IsOptional() @IsString() @MaxLength(2048) coverImageUrl?: string;
  @IsOptional() @IsBoolean() isVisible?: boolean;
  @IsOptional() @IsNumber() sortOrder?: number;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID("4", { each: true })
  classIds?: string[];
}
