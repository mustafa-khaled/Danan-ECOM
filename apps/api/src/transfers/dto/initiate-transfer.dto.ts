import { IsEnum, IsString, MinLength } from "class-validator";
import { TransferType } from "@dadan/db";

export class InitiateTransferDto {
  @IsString()
  pieceId!: string;

  @IsEnum(TransferType)
  transferType!: TransferType;

  @IsString()
  @MinLength(1)
  recipientHouseKey!: string;
}
