import { IsEnum, IsString, Length, Matches } from "class-validator";
import { TransferType } from "@dadan/db";

export class InitiateTransferDto {
  @IsString()
  pieceId!: string;

  @IsEnum(TransferType)
  transferType!: TransferType;

  /**
   * Recipient's shareable house ID (6 alphanumeric characters).
   * This is NOT the login credential (houseKey) - it's safe to share.
   */
  @IsString()
  @Length(6, 6, { message: "House ID must be exactly 6 characters" })
  @Matches(/^[A-Z0-9]{6}$/i, { message: "House ID must contain only letters and numbers" })
  recipientHouseId!: string;
}
