import { IsString, MinLength } from "class-validator";

export class ValidateKeyDto {
  @IsString()
  @MinLength(1)
  houseKey!: string;
}
