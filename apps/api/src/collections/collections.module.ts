import { Module } from "@nestjs/common";
import { CollectionsService, DesignCleanupService } from "./collections.service";
import { ClientCollectionsController } from "./client-collections.controller";
import { AdminCollectionsController } from "./admin-collections.controller";
import { AuthModule } from "../auth/auth.module";
import { AdminAuthModule } from "../admin/auth/admin-auth.module";

@Module({
  imports: [AuthModule, AdminAuthModule],
  controllers: [ClientCollectionsController, AdminCollectionsController],
  providers: [CollectionsService, DesignCleanupService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
