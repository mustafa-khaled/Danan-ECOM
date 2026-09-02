import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength } from "class-validator";

export class VisibilityGroupsDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  add?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  remove?: string[];
}
