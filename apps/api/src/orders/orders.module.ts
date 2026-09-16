import { Module } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { ClientOrdersController } from "./client-orders.controller";
import { AdminOrdersController } from "./admin-orders.controller";
import { AuthModule } from "../auth/auth.module";
import { AdminAuthModule } from "../admin/auth/admin-auth.module";
import { CertificatesModule } from "../certificates/certificates.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    AuthModule,
    AdminAuthModule,
    // Certificates are requested through the outbox rather than pushed to BullMQ
    // directly, so the queue registration lives with the dispatcher.
    CertificatesModule,
    NotificationsModule,
  ],
  controllers: [ClientOrdersController, AdminOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
