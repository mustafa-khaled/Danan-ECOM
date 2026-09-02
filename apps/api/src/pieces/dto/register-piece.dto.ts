import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class RegisterPieceDto {
  @IsUUID() designId!: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsUUID() initialClientId?: string;
}
