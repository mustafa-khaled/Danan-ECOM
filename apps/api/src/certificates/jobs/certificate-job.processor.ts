import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { ActorType } from "@dadan/db";
import { AuditService } from "../../audit/audit.service";
import { CertificatesService } from "../certificates.service";

export const CERTIFICATE_QUEUE = "certificate-generation";

export interface GenerateCertificateJobData {
  pieceId: string;
  clientId: string;
  orderId?: string;
  transferId?: string;
  regenerate?: boolean;
  adminId?: string;
}

@Processor(CERTIFICATE_QUEUE)
export class CertificateJobProcessor extends WorkerHost {
  private readonly logger = new Logger(CertificateJobProcessor.name);

  constructor(
    private readonly certificates: CertificatesService,
    private readonly audit: AuditService,
  ) {
    super();
  }

  async process(job: Job<GenerateCertificateJobData>): Promise<void> {
    const { pieceId, clientId, orderId, transferId, regenerate, adminId } = job.data;

    this.logger.log(
      `Processing certificate ${regenerate ? "regeneration" : "generation"} for piece ${pieceId} (attempt ${job.attemptsMade + 1})`,
    );

    if (regenerate && adminId) {
      await this.certificates.regenerateCertificate(pieceId, clientId, adminId);
    } else {
      await this.certificates.generateCertificate(pieceId, clientId);
    }

    const action = regenerate ? "CERTIFICATE_REGENERATED" : "CERTIFICATE_GENERATED";
    await this.audit.log({
      actorType: ActorType.SYSTEM,
      actorId: "system",
      action,
      targetType: "Piece",
      targetId: pieceId,
      metadata: { orderId, transferId, clientId },
    });
  }
}
