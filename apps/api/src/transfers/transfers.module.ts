import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { TransfersService } from "./transfers.service";
import { ClientTransfersController } from "./client-transfers.controller";
import { AdminTransfersController } from "./admin-transfers.controller";
import { AuthModule } from "../auth/auth.module";
import { AdminAuthModule } from "../admin/auth/admin-auth.module";
import { ClientsModule } from "../clients/clients.module";
import { CERTIFICATE_QUEUE } from "../certificates/jobs/certificate-job.processor";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    AuthModule,
    AdminAuthModule,
    BullModule.registerQueue({ name: CERTIFICATE_QUEUE }),
    ClientsModule,
    NotificationsModule,
  ],
  controllers: [ClientTransfersController, AdminTransfersController],
  providers: [TransfersService],
  exports: [TransfersService],
})
export class TransfersModule {}
