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
import { AdminRole, TransferStatus } from "@dadan/db";
import type { Request } from "express";
import { TransfersService } from "./transfers.service";
import { AdminGuard } from "../admin/auth/guards/admin.guard";
import { Roles } from "../admin/auth/decorators/roles.decorator";
import { CurrentAdmin } from "../admin/auth/decorators/current-admin.decorator";
import type { AdminSession } from "@dadan/types";
import { getClientIp } from "../common/constants";
import { ApproveTransferDto, RejectTransferDto } from "./dto/transfer-action.dto";

@Controller("admin/transfers")
@UseGuards(AdminGuard)
export class AdminTransfersController {
  constructor(private readonly transfers: TransfersService) {}

  @Get()
  list(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: TransferStatus,
  ) {
    return this.transfers.listAdminTransfers(
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
      status,
    );
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.transfers.getAdminTransfer(id);
  }

  @Post(":id/approve")
  @Roles(AdminRole.SUPER_ADMIN)
  approve(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @Body() dto: ApproveTransferDto,
    @Req() req: Request,
  ) {
    return this.transfers.approve(admin.adminId, id, dto.notes, getClientIp(req));
  }

  @Post(":id/reject")
  @Roles(AdminRole.SUPER_ADMIN)
  reject(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @Body() dto: RejectTransferDto,
    @Req() req: Request,
  ) {
    return this.transfers.reject(admin.adminId, id, dto.reason, getClientIp(req));
  }

  @Post(":id/contact-sender")
  contactSender(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    return this.transfers.logContact(admin.adminId, id, "sender", getClientIp(req));
  }

  @Post(":id/contact-recipient")
  contactRecipient(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    return this.transfers.logContact(admin.adminId, id, "recipient", getClientIp(req));
  }
}
