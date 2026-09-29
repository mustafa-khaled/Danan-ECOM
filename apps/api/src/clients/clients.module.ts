import { Module } from "@nestjs/common";
import { ClientsService } from "./clients.service";
import { ClientProfileController } from "./client-profile.controller";
import { AdminClientsController } from "./admin-clients.controller";
import { AuthModule } from "../auth/auth.module";
import { AdminAuthModule } from "../admin/auth/admin-auth.module";
import { ClassesModule } from "../classes/classes.module";
import { CollectionAccessSyncModule } from "../collections/collection-access-sync.module";

@Module({
  imports: [
    AuthModule,
    AdminAuthModule,
    ClassesModule,
    CollectionAccessSyncModule,
  ],
  controllers: [ClientProfileController, AdminClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
