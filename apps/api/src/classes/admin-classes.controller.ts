import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import type { AdminSession } from "@dadan/types";
import { AdminGuard } from "../admin/auth/guards/admin.guard";
import { CurrentAdmin } from "../admin/auth/decorators/current-admin.decorator";
import { Roles } from "../admin/auth/decorators/roles.decorator";
import { RequireAdminArea } from "../admin/auth/decorators/require-admin-area.decorator";
import { AdminArea } from "../admin/auth/admin-permissions";
import { AdminRole } from "@dadan/db";
import { getClientIp } from "../common/constants";
import { ClassesService } from "./classes.service";
import { CreateClassDto } from "./dto/create-class.dto";
import { UpdateClassDto } from "./dto/update-class.dto";

// Classes are read wherever members and collection access are shown, but they
// are only editable from the Settings page.
@Controller("admin/classes")
@UseGuards(AdminGuard)
@RequireAdminArea(AdminArea.MEMBERS)
export class AdminClassesController {
  constructor(private readonly classes: ClassesService) {}

  @Get()
  list() {
    return this.classes.list();
  }

  @Get(":id")
  getOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.classes.getById(id);
  }

  @Post()
  @Roles(AdminRole.SUPER_ADMIN)
  create(
    @CurrentAdmin() admin: AdminSession,
    @Body() dto: CreateClassDto,
    @Req() req: Request,
  ) {
    return this.classes.create(admin.adminId, dto, getClientIp(req));
  }

  @Patch(":id")
  @Roles(AdminRole.SUPER_ADMIN)
  update(
    @CurrentAdmin() admin: AdminSession,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateClassDto,
    @Req() req: Request,
  ) {
    return this.classes.update(admin.adminId, id, dto, getClientIp(req));
  }

  @Delete(":id")
  @Roles(AdminRole.SUPER_ADMIN)
  remove(
    @CurrentAdmin() admin: AdminSession,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    return this.classes.delete(admin.adminId, id, getClientIp(req));
  }
}
