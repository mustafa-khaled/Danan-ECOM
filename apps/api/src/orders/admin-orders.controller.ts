import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { OrdersService } from "./orders.service";
import { AdminGuard } from "../admin/auth/guards/admin.guard";
import { CurrentAdmin } from "../admin/auth/decorators/current-admin.decorator";
import type { AdminSession } from "@dadan/types";
import { getClientIp } from "../common/constants";
import { AdminOrderQueryDto } from "./dto/admin-order-query.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";

@Controller("admin/orders")
@UseGuards(AdminGuard)
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@Query() query: AdminOrderQueryDto) {
    return this.orders.listAdminOrders(query.page, query.limit, query.status, query.clientId);
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.orders.getAdminOrder(id);
  }

  @Patch(":id/status")
  updateStatus(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: Request,
  ) {
    return this.orders.updateOrderStatus(
      admin.adminId,
      id,
      dto.status,
      getClientIp(req),
    );
  }
}
