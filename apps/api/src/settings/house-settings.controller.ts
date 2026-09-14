import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { AdminGuard } from "../admin/auth/guards/admin.guard";
import { CurrentAdmin } from "../admin/auth/decorators/current-admin.decorator";
import type { AdminSession } from "@dadan/types";
import { getClientIp } from "../common/constants";
import { HouseSettingsService } from "./house-settings.service";
import { UpdateHouseSettingsDto } from "./dto/update-house-settings.dto";

@Controller("admin/settings")
@UseGuards(AdminGuard)
export class HouseSettingsController {
  constructor(private readonly settings: HouseSettingsService) {}

  @Get()
  get() {
    return this.settings.get();
  }

  @Patch()
  update(
    @CurrentAdmin() admin: AdminSession,
    @Body() dto: UpdateHouseSettingsDto,
    @Req() req: Request,
  ) {
    return this.settings.update(admin.adminId, dto, getClientIp(req));
  }
}
