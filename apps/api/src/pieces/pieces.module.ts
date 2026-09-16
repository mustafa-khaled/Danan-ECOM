import { Module } from "@nestjs/common";
import { PiecesService } from "./pieces.service";
import { SerialNumberService } from "./serial-number.service";
import { ClientWardrobeController } from "./client-wardrobe.controller";
import { ClientSavedController } from "./client-saved.controller";
import { AdminPiecesController } from "./admin-pieces.controller";
import { AuthModule } from "../auth/auth.module";
import { AdminAuthModule } from "../admin/auth/admin-auth.module";
import { CertificatesModule } from "../certificates/certificates.module";

@Module({
  imports: [
    AuthModule,
    AdminAuthModule,
    // Certificates are requested through the outbox rather than pushed to BullMQ
    // directly, so the queue registration lives with the dispatcher.
    CertificatesModule,
  ],
  controllers: [
    ClientWardrobeController,
    ClientSavedController,
    AdminPiecesController,
  ],
  providers: [PiecesService, SerialNumberService],
  exports: [PiecesService, SerialNumberService],
})
export class PiecesModule {}
