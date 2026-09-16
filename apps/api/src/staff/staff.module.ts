import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin/auth/admin-auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { StaffController } from "./staff.controller";
import { StaffService } from "./staff.service";

@Module({
  imports: [AdminAuthModule, NotificationsModule],
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}
