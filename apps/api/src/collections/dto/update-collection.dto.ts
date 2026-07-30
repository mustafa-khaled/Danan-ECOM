import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class UpdateCollectionDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() nameAr?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() descriptionAr?: string;
  @IsOptional() @IsString() coverImageUrl?: string;
  @IsOptional() @IsBoolean() isVisible?: boolean;
  @IsOptional() @IsNumber() sortOrder?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) visibilityGroups?: string[];
}
