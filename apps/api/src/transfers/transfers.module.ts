import { Module, forwardRef } from "@nestjs/common";
import { TransfersService } from "./transfers.service";
import { ClientTransfersController } from "./client-transfers.controller";
import { AdminTransfersController } from "./admin-transfers.controller";
import { AuthModule } from "../auth/auth.module";
import { AdminAuthModule } from "../admin/auth/admin-auth.module";
import { CertificatesModule } from "../certificates/certificates.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    AuthModule,
    AdminAuthModule,
    forwardRef(() => CertificatesModule),
    NotificationsModule,
  ],
  controllers: [ClientTransfersController, AdminTransfersController],
  providers: [TransfersService],
  exports: [TransfersService],
})
export class TransfersModule {}
