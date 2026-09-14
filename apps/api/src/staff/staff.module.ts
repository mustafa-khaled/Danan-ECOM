import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin/auth/admin-auth.module";
import { StaffController } from "./staff.controller";
import { StaffService } from "./staff.service";

@Module({
  imports: [AdminAuthModule],
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}
