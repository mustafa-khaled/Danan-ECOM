import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { AdminRole } from "@dadan/db";
import { Roles } from "../admin/auth/decorators/roles.decorator";
import { RequireAdminArea } from "../admin/auth/decorators/require-admin-area.decorator";
import { AdminArea } from "../admin/auth/admin-permissions";
import { AdminOrderQueryDto } from "./dto/admin-order-query.dto";
import { RefundOrderDto } from "./dto/refund-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";

@Controller("admin/orders")
@UseGuards(AdminGuard)
@RequireAdminArea(AdminArea.PAYMENTS)
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@Query() query: AdminOrderQueryDto) {
    return this.orders.listAdminOrders(query.page, query.limit, {
      status: query.status,
      paymentStatus: query.paymentStatus,
      paymentMethod: query.paymentMethod,
      clientId: query.clientId,
      q: query.q,
    });
  }

  @Get("stats")
  stats() {
    return this.orders.getOrderStats();
  }

  @Get(":id")
  getOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.orders.getAdminOrder(id);
  }

  @Patch(":id/status")
  updateStatus(
    @CurrentAdmin() admin: AdminSession,
    @Param("id", ParseUUIDPipe) id: string,
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

  /**
   * Unwinds a settled order. Separate from the status endpoint because it moves
   * money and ownership, not just a label.
   */
  @Patch(":id/refund")
  @Roles(AdminRole.SUPER_ADMIN)
  refund(
    @CurrentAdmin() admin: AdminSession,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RefundOrderDto,
    @Req() req: Request,
  ) {
    return this.orders.refundOrder(
      admin.adminId,
      id,
      dto.reason,
      getClientIp(req),
    );
  }
}
