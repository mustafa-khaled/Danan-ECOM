import { IsString, Matches, MaxLength, MinLength } from "class-validator";

/**
 * One `@Matches` with lookaheads rather than four separate rules: the exception
 * filter joins a validation message array into a single string, so several
 * failures would stop matching the `errors.*` key and lose their translation.
 */
const COMPLEXITY =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/;

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @Matches(COMPLEXITY, { message: "errors.PASSWORD_TOO_WEAK" })
  newPassword!: string;
}
