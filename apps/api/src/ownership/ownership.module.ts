import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin/auth/admin-auth.module";
import { OwnershipController } from "./ownership.controller";
import { OwnershipService } from "./ownership.service";

@Module({
  imports: [AdminAuthModule],
  controllers: [OwnershipController],
  providers: [OwnershipService],
})
export class OwnershipModule {}
