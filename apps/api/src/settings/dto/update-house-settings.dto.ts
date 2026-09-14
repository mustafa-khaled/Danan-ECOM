import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

export class NotificationPrefsDto {
  @IsOptional() @IsBoolean() ownershipTransferRequest?: boolean;
  @IsOptional() @IsBoolean() transferCompleted?: boolean;
  @IsOptional() @IsBoolean() newMemberInvitation?: boolean;
  @IsOptional() @IsBoolean() certificateIssued?: boolean;
  @IsOptional() @IsBoolean() accessRequest?: boolean;
  @IsOptional() @IsBoolean() paymentCompleted?: boolean;
  @IsOptional() @IsBoolean() paymentFailed?: boolean;
}

export class UpdateHouseSettingsDto {
  @IsOptional() @IsString() @MaxLength(200) houseName?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsEmail() contactEmail?: string;
  @IsOptional() @IsString() @MaxLength(64) supportContact?: string;
  @IsOptional() @IsString() @MaxLength(8) locale?: string;
  @IsOptional() @IsString() @MaxLength(64) timezone?: string;
  @IsOptional() @IsBoolean() privateHouseAccess?: boolean;
  @IsOptional() @IsBoolean() privateKeyRequired?: boolean;
  @IsOptional() @IsBoolean() adminApprovalRequired?: boolean;
  @IsOptional() @IsBoolean() allowInvitations?: boolean;
  @IsOptional() @IsInt() @Min(1) @Max(60) keyValidityMonths?: number;
  @IsOptional() @IsBoolean() requireKeyRenewal?: boolean;
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => NotificationPrefsDto)
  notificationPrefs?: NotificationPrefsDto;
}
