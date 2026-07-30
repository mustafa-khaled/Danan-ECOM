import { IsArray, IsOptional, IsString } from "class-validator";

export class VisibilityGroupsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  add?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  remove?: string[];
}
