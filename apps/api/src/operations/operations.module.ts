import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin/auth/admin-auth.module";
import { ClientsModule } from "../clients/clients.module";
import { OperationsController } from "./operations.controller";
import { OperationsService } from "./operations.service";

@Module({
  imports: [AdminAuthModule, ClientsModule],
  controllers: [OperationsController],
  providers: [OperationsService],
})
export class OperationsModule {}
