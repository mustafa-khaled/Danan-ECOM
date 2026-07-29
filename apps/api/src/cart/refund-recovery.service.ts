import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ActorType } from "@dadan/db";
import { AuditService } from "../audit/audit.service";
import { PaymentsService } from "../payments/payments.service";
import { PrismaService } from "../prisma/prisma.service";

const MAX_RETRY_ATTEMPTS = 5;

@Injectable()
export class RefundRecoveryService {
  private readonly logger = new Logger(RefundRecoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
    private readonly audit: AuditService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryFailedRefunds() {
    const failedRefunds = await this.prisma.db.failedRefund.findMany({
      where: {
        resolvedAt: null,
        attempts: { lt: MAX_RETRY_ATTEMPTS },
      },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    for (const record of failedRefunds) {
      try {
        const result = await this.payments.refund(
          record.providerReference,
          Number(record.amount),
          record.currency,
        );

        if (result.success) {
          await this.prisma.db.failedRefund.update({
            where: { id: record.id },
            data: {
              resolvedAt: new Date(),
              attempts: record.attempts + 1,
            },
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
              attempts: record.attempts + 1,
            },
          });

          this.logger.log(
            `Refund recovered for ${record.providerReference} (attempt ${record.attempts + 1})`,
          );
        } else {
          await this.prisma.db.failedRefund.update({
            where: { id: record.id },
            data: {
              attempts: record.attempts + 1,
              lastError: result.failureMessage ?? result.failureCode ?? "Unknown",
            },
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await this.prisma.db.failedRefund.update({
          where: { id: record.id },
          data: {
            attempts: record.attempts + 1,
            lastError: errorMessage,
          },
        });
      }
    }

    // Flag exhausted refunds for admin attention
    const exhausted = await this.prisma.db.failedRefund.findMany({
      where: {
        resolvedAt: null,
        attempts: { gte: MAX_RETRY_ATTEMPTS },
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

      // Mark as resolved to stop re-processing (admin must handle manually)
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
