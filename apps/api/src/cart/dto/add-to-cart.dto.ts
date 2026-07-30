import { IsString } from "class-validator";

export class AddToCartDto {
  @IsString()
  pieceId!: string;
}
