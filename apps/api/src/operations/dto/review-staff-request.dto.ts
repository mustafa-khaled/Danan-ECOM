import { IsOptional, IsString, MaxLength } from "class-validator";

export class ReviewStaffRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
