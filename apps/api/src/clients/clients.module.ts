import { Module } from "@nestjs/common";
import { ClientsService } from "./clients.service";
import { ClientProfileController } from "./client-profile.controller";
import { AdminClientsController } from "./admin-clients.controller";
import { AuthModule } from "../auth/auth.module";
import { AdminAuthModule } from "../admin/auth/admin-auth.module";

@Module({
  imports: [AuthModule, AdminAuthModule],
  controllers: [ClientProfileController, AdminClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
