import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { prisma } from "@dadan/db";

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  readonly db = prisma;

  async onModuleInit() {
    await prisma.$connect();
  }

  /**
   * Without this, a rolling deploy leaves the outgoing process holding its
   * PgBouncer connections until the TCP sockets time out, so the incoming one
   * can be starved of slots.
   */
  async onModuleDestroy() {
    try {
      await prisma.$disconnect();
    } catch (error) {
      this.logger.warn(
        `Prisma disconnect failed during shutdown: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
