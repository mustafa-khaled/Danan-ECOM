import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminAuthModule } from "../admin/auth/admin-auth.module";
import { VerifyService } from "./verify.service";
import { VerifyController } from "./verify.controller";
import { AdminVerificationLogsController } from "./admin-verification-logs.controller";

@Module({
  imports: [AuthModule, AdminAuthModule],
  controllers: [VerifyController, AdminVerificationLogsController],
  providers: [VerifyService],
})
export class VerifyModule {}
