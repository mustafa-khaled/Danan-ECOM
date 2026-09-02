import { IsEnum, IsOptional } from "class-validator";
import { TransferStatus } from "@dadan/db";

export class ClientTransferQueryDto {
  /**
   * Constrained to the enum so an unknown value is rejected at the edge
   * instead of reaching Prisma as an invalid filter.
   */
  @IsOptional()
  @IsEnum(TransferStatus)
  status?: TransferStatus;
}
