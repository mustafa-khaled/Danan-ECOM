import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { VerifyService } from "./verify.service";
import { VerifyController } from "./verify.controller";

@Module({
  imports: [AuthModule],
  controllers: [VerifyController],
  providers: [VerifyService],
})
export class VerifyModule {}
