import { Module } from "@nestjs/common";
import { CertificatesService } from "./certificates.service";
import { ClientCertificatesController } from "./client-certificates.controller";
import { AdminCertificatesController } from "./admin-certificates.controller";
import { AuthModule } from "../auth/auth.module";
import { AdminAuthModule } from "../admin/auth/admin-auth.module";

@Module({
  imports: [AuthModule, AdminAuthModule],
  controllers: [ClientCertificatesController, AdminCertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
