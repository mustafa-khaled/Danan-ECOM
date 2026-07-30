import { IsOptional, IsString, IsUUID } from "class-validator";

export class RegisterPieceDto {
  @IsUUID() designId!: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsUUID() initialClientId?: string;
}
