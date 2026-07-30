import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class SpecItemDto {
  @IsString() key!: string;
  @IsOptional() @IsString() keyAr?: string;
  @IsString() value!: string;
  @IsOptional() @IsString() valueAr?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

export class BulkSpecsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecItemDto)
  specifications!: SpecItemDto[];
}
