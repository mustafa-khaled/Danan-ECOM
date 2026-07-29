import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { RefreshTokenService } from "./refresh-token.service";

@Module({
  imports: [ConfigModule],
  providers: [RefreshTokenService],
  exports: [RefreshTokenService],
})
export class RefreshTokenModule {}
