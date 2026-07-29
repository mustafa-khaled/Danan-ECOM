import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { CertificatesService } from "./certificates.service";
import { CertificateJobProcessor, CERTIFICATE_QUEUE } from "./jobs/certificate-job.processor";
import { ClientCertificatesController } from "./client-certificates.controller";
import { AdminCertificatesController } from "./admin-certificates.controller";
import { AuthModule } from "../auth/auth.module";
import { AdminAuthModule } from "../admin/auth/admin-auth.module";

@Module({
  imports: [
    AuthModule,
    AdminAuthModule,
    BullModule.registerQueue({ name: CERTIFICATE_QUEUE }),
  ],
  controllers: [ClientCertificatesController, AdminCertificatesController],
  providers: [CertificatesService, CertificateJobProcessor],
  exports: [CertificatesService],
})
export class CertificatesModule {}
