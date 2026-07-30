import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateDesignDto {
  @IsString() name!: string;
  @IsString() @MinLength(1) nameAr!: string;
  @IsString() slug!: string;
  @IsString() collectionId!: string;
  @IsString() @MinLength(1) story!: string;
  @IsString() @MinLength(1) storyAr!: string;
  @IsString() material!: string;
  @IsOptional() @IsString() materialAr?: string;
  @IsNumber() weight!: number;
  @IsString() dimensions!: string;
  @IsOptional() @IsString() dimensionsAr?: string;
  @IsNumber() basePrice!: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) visibilityGroups?: string[];
}
