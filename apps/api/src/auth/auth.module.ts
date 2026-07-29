import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { ClientGuard } from "./guards/client.guard";
import { RefreshTokenModule } from "./refresh-token.module";
import { getAccessTokenSeconds } from "../common/constants";

@Module({
  imports: [
    RefreshTokenModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_SECRET"),
        signOptions: { expiresIn: getAccessTokenSeconds() },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, ClientGuard],
  exports: [AuthService, ClientGuard, JwtModule, RefreshTokenModule],
})
export class AuthModule {}
