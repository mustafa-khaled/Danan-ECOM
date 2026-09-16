import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Queue } from "bullmq";
import type { Prisma } from "@dadan/db";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { withCronLease } from "../common/cron/cron-lease";
import {
  CERTIFICATE_QUEUE,
  type GenerateCertificateJobData,
} from "./jobs/certificate-job.processor";

export interface CertificateRequest {
  pieceId: string;
  clientId: string;
  orderId?: string;
  transferId?: string;
  regenerate?: boolean;
  adminId?: string;
}

const BATCH_SIZE = 25;
/** Below the 1-minute cron interval so a crashed run resumes on the next tick. */
const LEASE_SECONDS = 45;

interface ClaimedRow {
  id: string;
  pieceId: string;
  clientId: string;
  orderId: string | null;
  transferId: string | null;
  regenerate: boolean;
  adminId: string | null;
}

/**
 * Drains `CertificateOutbox` into the BullMQ certificate queue.
 *
 * Callers record the intent with `record(tx, ...)` inside the transaction that
 * moves ownership, so the promise of a certificate commits or rolls back with the
 * ownership change itself. This dispatcher is the only thing that talks to Redis,
 * and a failure here is retried on the next tick instead of being lost.
 */
@Injectable()
export class CertificateOutboxService {
  private readonly logger = new Logger(CertificateOutboxService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @InjectQueue(CERTIFICATE_QUEUE)
    private readonly queue: Queue<GenerateCertificateJobData>,
  ) {}

  /** Must be called with the transaction that performs the ownership change. */
  async record(
    tx: Prisma.TransactionClient,
    request: CertificateRequest,
  ): Promise<void> {
    await tx.certificateOutbox.create({
      data: {
        pieceId: request.pieceId,
        clientId: request.clientId,
        orderId: request.orderId,
        transferId: request.transferId,
        regenerate: request.regenerate ?? false,
        adminId: request.adminId,
      },
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async dispatchPending(): Promise<void> {
    await withCronLease(
      this.redis,
      "certificates:outbox-dispatch",
      LEASE_SECONDS,
      this.logger,
      () => this.drain(),
    );
  }

  private async drain(): Promise<void> {
    for (const row of await this.claimBatch()) {
      try {
        await this.queue.add(
          row.regenerate ? "regenerate-certificate" : "generate-certificate",
          {
            pieceId: row.pieceId,
            clientId: row.clientId,
            ...(row.orderId ? { orderId: row.orderId } : {}),
            ...(row.transferId ? { transferId: row.transferId } : {}),
            ...(row.regenerate ? { regenerate: true } : {}),
            ...(row.adminId ? { adminId: row.adminId } : {}),
          },
          {
            attempts: 5,
            backoff: { type: "exponential", delay: 2000 },
            removeOnComplete: true,
            removeOnFail: 50,
            // Keyed on the outbox row so a re-dispatch after a crash between the
            // enqueue and the `dispatchedAt` write reuses the same job.
            jobId: `outbox:${row.id}`,
          },
        );

        await this.prisma.db.certificateOutbox.update({
          where: { id: row.id },
          data: { dispatchedAt: new Date() },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed to dispatch certificate outbox row ${row.id} (piece ${row.pieceId}): ${message}`,
        );
        await this.prisma.db.certificateOutbox
          .update({ where: { id: row.id }, data: { lastError: message } })
          .catch(() => undefined);
      }
    }
  }

  /**
   * Claims rows by bumping `attempts` in the same statement that selects them, so
   * two instances cannot dispatch the same row and a crash mid-dispatch is
   * visible in the attempt count rather than looking like a fresh row.
   */
  private async claimBatch(): Promise<ClaimedRow[]> {
    return this.prisma.db.$queryRaw<ClaimedRow[]>`
      UPDATE "CertificateOutbox"
      SET "attempts" = "attempts" + 1
      WHERE id IN (
        SELECT id
        FROM "CertificateOutbox"
        WHERE "dispatchedAt" IS NULL
        ORDER BY "createdAt" ASC
        LIMIT ${BATCH_SIZE}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, "pieceId", "clientId", "orderId", "transferId", "regenerate", "adminId"
    `;
  }
}
