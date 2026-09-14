import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class UpdateCollectionDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(200) nameAr?: string;
  @IsOptional() @IsString() @MaxLength(128) slug?: string;
  @IsOptional() @IsString() @MaxLength(10000) description?: string;
  @IsOptional() @IsString() @MaxLength(10000) descriptionAr?: string;
  @IsOptional() @IsString() @MaxLength(2048) coverImageUrl?: string;
  @IsOptional() @IsBoolean() isVisible?: boolean;
  @IsOptional() @IsNumber() sortOrder?: number;
  @IsOptional() @IsString() @MaxLength(10000) origin?: string;
  @IsOptional() @IsString() @MaxLength(10000) originAr?: string;
  @IsOptional() @IsString() @MaxLength(10000) meaning?: string;
  @IsOptional() @IsString() @MaxLength(10000) meaningAr?: string;
  @IsOptional() @IsString() @MaxLength(10000) inspiration?: string;
  @IsOptional() @IsString() @MaxLength(10000) inspirationAr?: string;
  @IsOptional() @IsString() @MaxLength(20000) storyContent?: string;
  @IsOptional() @IsString() @MaxLength(20000) storyContentAr?: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID("4", { each: true })
  classIds?: string[];
}
