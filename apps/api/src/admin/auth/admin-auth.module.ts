import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AdminAuthService } from "./admin-auth.service";
import { AdminAuthController } from "./admin-auth.controller";
import { AdminGuard } from "./guards/admin.guard";
import { RefreshTokenModule } from "../../auth/refresh-token.module";
import { getAccessTokenSeconds } from "../../common/constants";

@Module({
  imports: [
    RefreshTokenModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // Distinct from the client signing key so a leaked client secret
        // cannot mint admin sessions. The `aud` claim is still checked in
        // AdminGuard; this makes the separation cryptographic rather than
        // resting on that check alone.
        secret: config.getOrThrow<string>("ADMIN_JWT_SECRET"),
        signOptions: { expiresIn: getAccessTokenSeconds() },
      }),
    }),
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminGuard],
  exports: [AdminAuthService, AdminGuard, JwtModule],
})
export class AdminAuthModule {}
