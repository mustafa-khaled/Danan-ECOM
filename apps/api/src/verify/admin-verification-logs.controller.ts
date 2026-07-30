import {
  Controller,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminGuard } from "../admin/auth/guards/admin.guard";
import { PrismaService } from "../prisma/prisma.service";
import { paginationParams } from "../common/constants";

@Controller("admin/verification-logs")
@UseGuards(AdminGuard)
export class AdminVerificationLogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query("page") page?: string, @Query("limit") limit?: string) {
    const { skip, take, page: p, limit: l } = paginationParams(
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );

    const [items, total] = await Promise.all([
      this.prisma.db.verificationLog.findMany({
        skip,
        take,
        orderBy: { verifiedAt: "desc" },
      }),
      this.prisma.db.verificationLog.count(),
    ]);

    return { items, total, page: p, limit: l };
  }
}
