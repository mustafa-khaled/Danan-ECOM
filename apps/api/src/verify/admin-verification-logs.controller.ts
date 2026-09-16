import {
  Controller,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminGuard } from "../admin/auth/guards/admin.guard";
import { RequireAdminArea } from "../admin/auth/decorators/require-admin-area.decorator";
import { AdminArea } from "../admin/auth/admin-permissions";
import { PrismaService } from "../prisma/prisma.service";
import { paginationParams } from "../common/constants";
import { AdminVerificationLogQueryDto } from "./dto/admin-verification-log-query.dto";

@Controller("admin/verification-logs")
@UseGuards(AdminGuard)
@RequireAdminArea(AdminArea.OWNERSHIP)
export class AdminVerificationLogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() query: AdminVerificationLogQueryDto) {
    const { skip, take, page: p, limit: l } = paginationParams(query.page, query.limit);
    const q = query.q?.trim();
    const where = {
      ...(query.result ? { result: query.result } : {}),
      ...(q ? { serialNumber: { contains: q.toUpperCase() } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.db.verificationLog.findMany({
        skip,
        take,
        where,
        orderBy: { verifiedAt: "desc" },
        select: {
          id: true,
          serialNumber: true,
          result: true,
          ipAddress: true,
          verifiedAt: true,
          pieceId: true,
          clientId: true,
        },
      }),
      this.prisma.db.verificationLog.count({ where }),
    ]);

    return { items, total, page: p, limit: l };
  }
}
