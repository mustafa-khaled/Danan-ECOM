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
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { AdminRole } from "@dadan/db";
import { ClientsService } from "./clients.service";
import { AdminGuard } from "../admin/auth/guards/admin.guard";
import { Roles } from "../admin/auth/decorators/roles.decorator";
import { CurrentAdmin } from "../admin/auth/decorators/current-admin.decorator";
import type { AdminSession } from "@dadan/types";
import type { Request } from "express";
import { getClientIp } from "../common/constants";

class CreateClientDto {
  @IsString()
  @MinLength(1)
  displayName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  visibilityGroups?: string[];
}

class UpdateClientDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  visibilityGroups?: string[];
}

class VisibilityGroupsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  add?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  remove?: string[];
}

@Controller("admin/clients")
@UseGuards(AdminGuard)
export class AdminClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  list(@Query("page") page?: string, @Query("limit") limit?: string) {
    return this.clients.listClients(
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
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
