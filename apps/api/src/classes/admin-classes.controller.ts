import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import type { AdminSession } from "@dadan/types";
import { AdminGuard } from "../admin/auth/guards/admin.guard";
import { CurrentAdmin } from "../admin/auth/decorators/current-admin.decorator";
import { getClientIp } from "../common/constants";
import { ClassesService } from "./classes.service";
import { CreateClassDto } from "./dto/create-class.dto";
import { UpdateClassDto } from "./dto/update-class.dto";

@Controller("admin/classes")
@UseGuards(AdminGuard)
export class AdminClassesController {
  constructor(private readonly classes: ClassesService) {}

  @Get()
  list() {
    return this.classes.list();
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.classes.getById(id);
  }

  @Post()
  create(
    @CurrentAdmin() admin: AdminSession,
    @Body() dto: CreateClassDto,
    @Req() req: Request,
  ) {
    return this.classes.create(admin.adminId, dto, getClientIp(req));
  }

  @Patch(":id")
  update(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @Body() dto: UpdateClassDto,
    @Req() req: Request,
  ) {
    return this.classes.update(admin.adminId, id, dto, getClientIp(req));
  }

  @Delete(":id")
  remove(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    return this.classes.delete(admin.adminId, id, getClientIp(req));
  }
}
