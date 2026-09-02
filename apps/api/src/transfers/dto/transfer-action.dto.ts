import { IsOptional, IsString, MaxLength } from "class-validator";

export class ApproveTransferDto {
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class RejectTransferDto {
  @IsString() @MaxLength(2000) reason!: string;
}
