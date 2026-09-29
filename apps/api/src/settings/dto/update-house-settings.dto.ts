import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { HOUSE_TIMEZONES, type HouseTimezone } from "@dadan/types";

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
  // The column holds an IANA identifier; the old @IsString let the admin UI
  // persist labels like "utc" that no date formatter accepts.
  @IsOptional() @IsIn(HOUSE_TIMEZONES) timezone?: HouseTimezone;
  @IsOptional() @IsBoolean() privateHouseAccess?: boolean;
  @IsOptional() @IsBoolean() privateKeyRequired?: boolean;
  @IsOptional() @IsBoolean() adminApprovalRequired?: boolean;
  @IsOptional() @IsBoolean() allowInvitations?: boolean;
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => NotificationPrefsDto)
  notificationPrefs?: NotificationPrefsDto;
}
