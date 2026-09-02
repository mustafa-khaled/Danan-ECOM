import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class SpecItemDto {
  @IsString() @MaxLength(200) key!: string;
  @IsOptional() @IsString() @MaxLength(200) keyAr?: string;
  @IsString() @MaxLength(200) value!: string;
  @IsOptional() @IsString() @MaxLength(200) valueAr?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

export class BulkSpecsDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SpecItemDto)
  specifications!: SpecItemDto[];
}
