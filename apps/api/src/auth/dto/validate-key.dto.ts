import { IsString, MaxLength, MinLength } from "class-validator";

export class ValidateKeyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  houseKey!: string;
}
