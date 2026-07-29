import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { OrdersService } from "./orders.service";
import { ClientOrdersController } from "./client-orders.controller";
import { AdminOrdersController } from "./admin-orders.controller";
import { AuthModule } from "../auth/auth.module";
import { AdminAuthModule } from "../admin/auth/admin-auth.module";
import { CERTIFICATE_QUEUE } from "../certificates/jobs/certificate-job.processor";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    AuthModule,
    AdminAuthModule,
    BullModule.registerQueue({ name: CERTIFICATE_QUEUE }),
    NotificationsModule,
  ],
  controllers: [ClientOrdersController, AdminOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
