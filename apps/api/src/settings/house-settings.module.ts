import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin/auth/admin-auth.module";
import { HouseSettingsController } from "./house-settings.controller";
import { HouseSettingsService } from "./house-settings.service";

@Module({
  imports: [AdminAuthModule],
  controllers: [HouseSettingsController],
  providers: [HouseSettingsService],
})
export class HouseSettingsModule {}
