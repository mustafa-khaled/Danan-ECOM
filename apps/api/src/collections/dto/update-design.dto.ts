import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateDesignDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(200) nameAr?: string;
  @IsOptional() @IsString() @MaxLength(128) slug?: string;
  @IsOptional() @IsString() @MaxLength(64) collectionId?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(10000) story?: string;
  @IsOptional() @IsString() @MaxLength(10000) storyAr?: string;
  @IsOptional() @IsString() @MaxLength(200) material?: string;
  @IsOptional() @IsString() @MaxLength(200) materialAr?: string;
  @IsOptional() @IsNumber() weight?: number;
  @IsOptional() @IsString() @MaxLength(200) dimensions?: string;
  @IsOptional() @IsString() @MaxLength(200) dimensionsAr?: string;
  @IsOptional() @IsNumber() basePrice?: number;
  @IsOptional() @IsString() @MaxLength(8) currency?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(2048, { each: true })
  imageUrls?: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  visibilityGroups?: string[];
}
