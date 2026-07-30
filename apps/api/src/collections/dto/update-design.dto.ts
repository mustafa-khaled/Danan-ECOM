import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class UpdateDesignDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() nameAr?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() collectionId?: string;
  @IsOptional() @IsString() @MinLength(1) story?: string;
  @IsOptional() @IsString() storyAr?: string;
  @IsOptional() @IsString() material?: string;
  @IsOptional() @IsString() materialAr?: string;
  @IsOptional() @IsNumber() weight?: number;
  @IsOptional() @IsString() dimensions?: string;
  @IsOptional() @IsString() dimensionsAr?: string;
  @IsOptional() @IsNumber() basePrice?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) imageUrls?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) visibilityGroups?: string[];
}
