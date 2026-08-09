import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminRole } from "@dadan/db";
import { CertificatesService } from "./certificates.service";
import { AdminGuard } from "../admin/auth/guards/admin.guard";
import { Roles } from "../admin/auth/decorators/roles.decorator";
import { CurrentAdmin } from "../admin/auth/decorators/current-admin.decorator";
import type { AdminSession } from "@dadan/types";
import { PaginationQueryDto } from "../common/dto/pagination.dto";
import { PrismaService } from "../prisma/prisma.service";

@Controller("admin/certificates")
@UseGuards(AdminGuard)
export class AdminCertificatesController {
  constructor(
    private readonly certificates: CertificatesService,
    private readonly prisma: PrismaService,
  ) {}

  @Post("regenerate/:pieceId")
  @Roles(AdminRole.SUPER_ADMIN)
  async regenerate(
    @CurrentAdmin() admin: AdminSession,
    @Param("pieceId") pieceId: string,
  ) {
    const piece = await this.prisma.db.piece.findUnique({ where: { id: pieceId } });
    if (!piece?.currentOwnerId) {
      throw new NotFoundException("Piece has no owner");
    }
    return this.certificates.regenerateCertificate(
      pieceId,
      piece.currentOwnerId,
      admin.adminId,
    );
  }

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.certificates.listCertificates(query.page, query.limit);
  }
}
