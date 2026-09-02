import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateDesignDto {
  @IsString() @MaxLength(200) name!: string;
  @IsString() @MinLength(1) @MaxLength(200) nameAr!: string;
  @IsString() @MaxLength(128) slug!: string;
  @IsString() @MaxLength(64) collectionId!: string;
  @IsString() @MinLength(1) @MaxLength(10000) story!: string;
  @IsString() @MinLength(1) @MaxLength(10000) storyAr!: string;
  @IsString() @MaxLength(200) material!: string;
  @IsOptional() @IsString() @MaxLength(200) materialAr?: string;
  @IsNumber() weight!: number;
  @IsString() @MaxLength(200) dimensions!: string;
  @IsOptional() @IsString() @MaxLength(200) dimensionsAr?: string;
  @IsNumber() basePrice!: number;
  @IsOptional() @IsString() @MaxLength(8) currency?: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  visibilityGroups?: string[];
}
