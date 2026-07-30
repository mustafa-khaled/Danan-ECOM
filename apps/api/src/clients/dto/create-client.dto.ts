import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateClientDto {
  @IsString()
  @MinLength(1)
  displayName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  visibilityGroups?: string[];
}
