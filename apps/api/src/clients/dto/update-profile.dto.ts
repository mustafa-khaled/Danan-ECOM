import { IsIn, IsOptional, IsString } from "class-validator";
import { SUPPORTED_LOCALES } from "../../common/i18n/locale";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn([...SUPPORTED_LOCALES])
  locale?: string;
}
