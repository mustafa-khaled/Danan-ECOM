import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { SUPPORTED_LOCALES } from "../../common/i18n/locale";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsIn([...SUPPORTED_LOCALES])
  locale?: string;
}
