import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AdminRole } from "@dadan/db";
import { ClientsService } from "./clients.service";
import { AdminGuard } from "../admin/auth/guards/admin.guard";
import { Roles } from "../admin/auth/decorators/roles.decorator";
import { CurrentAdmin } from "../admin/auth/decorators/current-admin.decorator";
import type { AdminSession } from "@dadan/types";
import type { Request } from "express";
import { getClientIp } from "../common/constants";
import { PaginationQueryDto } from "../common/dto/pagination.dto";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import { VisibilityGroupsDto } from "./dto/visibility-groups.dto";

@Controller("admin/clients")
@UseGuards(AdminGuard)
export class AdminClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.clients.listClients(query.page, query.limit);
  }

  @Post()
  create(
    @CurrentAdmin() admin: AdminSession,
    @Body() dto: CreateClientDto,
    @Req() req: Request,
  ) {
    return this.clients.createClient(admin.adminId, dto, getClientIp(req));
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.clients.getClientById(id);
  }

  @Patch(":id")
  update(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @Body() dto: UpdateClientDto,
    @Req() req: Request,
  ) {
    return this.clients.updateClient(admin.adminId, id, dto, getClientIp(req));
  }

  @Post(":id/visibility-groups")
  updateVisibility(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @Body() dto: VisibilityGroupsDto,
    @Req() req: Request,
  ) {
    return this.clients.updateVisibilityGroups(
      admin.adminId,
      id,
      dto.add,
      dto.remove,
      getClientIp(req),
    );
  }

  @Post(":id/rotate-key")
  @Roles(AdminRole.SUPER_ADMIN)
  rotateKey(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    return this.clients.rotateKey(admin.adminId, id, getClientIp(req));
  }
}
