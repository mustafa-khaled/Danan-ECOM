import { IsString, MaxLength, MinLength } from "class-validator";

export class RefundOrderDto {
  /** Recorded on the audit entry and the queued refund, so it must be meaningful. */
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
