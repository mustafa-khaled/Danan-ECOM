import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { AdminGuard } from "../admin/auth/guards/admin.guard";
import { CurrentAdmin } from "../admin/auth/decorators/current-admin.decorator";
import type { AdminSession } from "@dadan/types";
import { getClientIp } from "../common/constants";
import { OperationsService } from "./operations.service";
import { AdminOperationsQueryDto } from "./dto/admin-operations-query.dto";
import { CreateStaffRequestDto } from "./dto/create-staff-request.dto";
import { ReviewStaffRequestDto } from "./dto/review-staff-request.dto";

@Controller("admin/operations")
@UseGuards(AdminGuard)
export class OperationsController {
  constructor(private readonly operations: OperationsService) {}

  @Get()
  list(@Query() query: AdminOperationsQueryDto) {
    return this.operations.list(query.page, query.limit, {
      q: query.q,
      type: query.type,
      status: query.status,
    });
  }

  @Get("stats")
  stats() {
    return this.operations.stats();
  }

  @Get(":id")
  getOne(
    @Param("id") id: string,
    @Query("kind") kind?: "transfer" | "staff",
  ) {
    return this.operations.getOne(id, kind);
  }

  @Post("staff-requests")
  create(
    @CurrentAdmin() admin: AdminSession,
    @Body() dto: CreateStaffRequestDto,
    @Req() req: Request,
  ) {
    return this.operations.create(admin.adminId, dto, getClientIp(req));
  }

  @Post("staff-requests/:id/approve")
  approve(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @Body() dto: ReviewStaffRequestDto,
    @Req() req: Request,
  ) {
    return this.operations.approve(
      admin.adminId,
      id,
      dto.notes,
      getClientIp(req),
      admin.role,
    );
  }

  @Post("staff-requests/:id/reject")
  reject(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @Body() dto: ReviewStaffRequestDto,
    @Req() req: Request,
  ) {
    return this.operations.reject(admin.adminId, id, dto.notes, getClientIp(req));
  }
}
