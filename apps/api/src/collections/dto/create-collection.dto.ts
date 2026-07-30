import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateCollectionDto {
  @IsString() name!: string;
  @IsString() @MinLength(1) nameAr!: string;
  @IsString() slug!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() descriptionAr?: string;
  @IsOptional() @IsString() coverImageUrl?: string;
  @IsOptional() @IsBoolean() isVisible?: boolean;
  @IsOptional() @IsNumber() sortOrder?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) visibilityGroups?: string[];
}
