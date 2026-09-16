import { Module } from "@nestjs/common";
import { TransfersService } from "./transfers.service";
import { ClientTransfersController } from "./client-transfers.controller";
import { AdminTransfersController } from "./admin-transfers.controller";
import { AuthModule } from "../auth/auth.module";
import { AdminAuthModule } from "../admin/auth/admin-auth.module";
import { CertificatesModule } from "../certificates/certificates.module";
import { ClientsModule } from "../clients/clients.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    AuthModule,
    AdminAuthModule,
    // Certificates are requested through the outbox rather than pushed to BullMQ
    // directly, so the queue registration lives with the dispatcher.
    CertificatesModule,
    ClientsModule,
    NotificationsModule,
  ],
  controllers: [ClientTransfersController, AdminTransfersController],
  providers: [TransfersService],
  exports: [TransfersService],
})
export class TransfersModule {}
