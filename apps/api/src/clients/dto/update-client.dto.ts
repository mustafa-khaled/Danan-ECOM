import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
} from "class-validator";

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  visibilityGroups?: string[];
}
