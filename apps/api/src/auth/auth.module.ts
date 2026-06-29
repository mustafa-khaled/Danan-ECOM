import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { ClientGuard } from "./guards/client.guard";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_SECRET"),
        signOptions: { expiresIn: 30 * 24 * 60 * 60 },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, ClientGuard],
  exports: [AuthService, ClientGuard, JwtModule],
})
export class AuthModule {}
