import { IsString, MaxLength, MinLength } from "class-validator";

export class VerifyDto {
  @IsString() @MinLength(1) @MaxLength(64) serial!: string;
  @IsString() @MinLength(1) @MaxLength(128) token!: string;
}
