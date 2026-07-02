import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { ClientGuard } from "./guards/client.guard";
import { SESSION_DURATION_SECONDS } from "../common/constants";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_SECRET"),
        signOptions: { expiresIn: SESSION_DURATION_SECONDS },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, ClientGuard],
  exports: [AuthService, ClientGuard, JwtModule],
})
export class AuthModule {}
