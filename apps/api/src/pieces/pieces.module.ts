import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { PiecesService } from "./pieces.service";
import { SerialNumberService } from "./serial-number.service";
import { ClientWardrobeController } from "./client-wardrobe.controller";
import { ClientSavedController } from "./client-saved.controller";
import { AdminPiecesController } from "./admin-pieces.controller";
import { AuthModule } from "../auth/auth.module";
import { AdminAuthModule } from "../admin/auth/admin-auth.module";
import { CERTIFICATE_QUEUE } from "../certificates/jobs/certificate-job.processor";

@Module({
  imports: [
    AuthModule,
    AdminAuthModule,
    BullModule.registerQueue({ name: CERTIFICATE_QUEUE }),
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
