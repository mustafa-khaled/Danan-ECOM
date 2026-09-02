import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { AdminRole } from "@dadan/db";
import { CertificatesService } from "./certificates.service";
import { CERTIFICATE_QUEUE } from "./jobs/certificate-job.processor";
import type { GenerateCertificateJobData } from "./jobs/certificate-job.processor";
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
    @InjectQueue(CERTIFICATE_QUEUE)
    private readonly certificateQueue: Queue<GenerateCertificateJobData>,
  ) {}

  /**
   * Rendering a certificate PDF is CPU- and memory-heavy, so it runs on the
   * shared queue instead of blocking a request thread.
   */
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

    await this.certificateQueue.add(
      "generate-certificate",
      {
        pieceId,
        clientId: piece.currentOwnerId,
        regenerate: true,
        adminId: admin.adminId,
      },
      {
        attempts: 5,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: true,
        removeOnFail: 50,
        // One in-flight regeneration per piece; a double-click or retry
        // reuses the pending job instead of queueing another render.
        jobId: `regenerate:${pieceId}`,
      },
    );

    return { success: true, queued: true };
  }

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.certificates.listCertificates(query.page, query.limit);
  }
}
