import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ActorType } from "@dadan/db";
import { AuditService } from "../audit/audit.service";
import { PaymentsService } from "../payments/payments.service";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { withCronLease } from "../common/cron/cron-lease";

const MAX_RETRY_ATTEMPTS = 5;
const BATCH_SIZE = 10;

/** Below the 5-minute cron interval so a crashed run resumes on the next tick. */
const LEASE_SECONDS = 4 * 60;

interface ClaimedRefund {
  id: string;
  clientId: string;
  providerReference: string;
  amount: string;
  currency: string;
  attempts: number;
}

@Injectable()
export class RefundRecoveryService {
  private readonly logger = new Logger(RefundRecoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
    private readonly audit: AuditService,
    private readonly redis: RedisService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryFailedRefunds() {
    await withCronLease(
      this.redis,
      "cart:retry-failed-refunds",
      LEASE_SECONDS,
      this.logger,
      () => this.drainQueue(),
    );
  }

  private async drainQueue(): Promise<void> {
    for (const record of await this.claimBatch()) {
      await this.attemptRefund(record);
    }
    await this.escalateExhausted();
  }

  /**
   * Claims a batch by incrementing `attempts` in the same statement that selects
   * the rows, so no two workers can pick up the same refund and a crash mid-call
   * consumes the attempt rather than retrying an unknown gateway state forever.
   *
   * `SKIP LOCKED` keeps concurrent claimers from blocking on each other, and the
   * read-modify-write on `attempts` that this replaces could silently lose an
   * increment whenever two passes overlapped.
   */
  private async claimBatch(): Promise<ClaimedRefund[]> {
    return this.prisma.db.$queryRaw<ClaimedRefund[]>`
      UPDATE "FailedRefund"
      SET "attempts" = "attempts" + 1
      WHERE id IN (
        SELECT id
        FROM "FailedRefund"
        WHERE "resolvedAt" IS NULL
          AND "attempts" < ${MAX_RETRY_ATTEMPTS}
        ORDER BY "createdAt" ASC
        LIMIT ${BATCH_SIZE}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, "clientId", "providerReference", amount, currency, attempts
    `;
  }

  private async attemptRefund(record: ClaimedRefund): Promise<void> {
    try {
      const result = await this.payments.refund(
        record.providerReference,
        Number(record.amount),
        record.currency,
      );

      if (!result.success) {
        await this.prisma.db.failedRefund.update({
          where: { id: record.id },
          data: {
            lastError: result.failureMessage ?? result.failureCode ?? "Unknown",
          },
        });
        return;
      }

      await this.prisma.db.failedRefund.update({
        where: { id: record.id },
        data: { resolvedAt: new Date() },
      });

      await this.audit.log({
        actorType: ActorType.SYSTEM,
        actorId: "refund-recovery",
        action: "REFUND_RECOVERED",
        targetType: "Client",
        targetId: record.clientId,
        metadata: {
          providerReference: record.providerReference,
          amount: Number(record.amount),
          attempts: record.attempts,
        },
      });

      this.logger.log(
        `Refund recovered for ${record.providerReference} (attempt ${record.attempts})`,
      );
    } catch (error) {
      await this.prisma.db.failedRefund.update({
        where: { id: record.id },
        data: {
          lastError: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  /** Hands refunds that used up every attempt to an admin and stops retrying. */
  private async escalateExhausted(): Promise<void> {
    const exhausted = await this.prisma.db.failedRefund.findMany({
      where: { resolvedAt: null, attempts: { gte: MAX_RETRY_ATTEMPTS } },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
      select: {
        id: true,
        clientId: true,
        providerReference: true,
        amount: true,
        attempts: true,
        lastError: true,
      },
    });

    for (const record of exhausted) {
      await this.audit.log({
        actorType: ActorType.SYSTEM,
        actorId: "refund-recovery",
        action: "REFUND_RECOVERY_EXHAUSTED",
        targetType: "Client",
        targetId: record.clientId,
        metadata: {
          providerReference: record.providerReference,
          amount: Number(record.amount),
          attempts: record.attempts,
          lastError: record.lastError,
        },
      });

      // Resolved only in the sense that automation is done with it; the money
      // has not moved, so the audit entry above is the handoff to a human.
      await this.prisma.db.failedRefund.update({
        where: { id: record.id },
        data: { resolvedAt: new Date(), lastError: "EXHAUSTED_MANUAL_REQUIRED" },
      });

      this.logger.error(
        `Refund recovery exhausted for ${record.providerReference} (client ${record.clientId}). Manual reconciliation required.`,
      );
    }
  }
}
