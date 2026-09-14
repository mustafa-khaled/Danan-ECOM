import { Module } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { ClientNotificationsController } from "./client-notifications.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [ClientNotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
