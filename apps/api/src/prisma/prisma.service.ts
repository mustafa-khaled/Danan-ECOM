import { Injectable, OnModuleInit } from "@nestjs/common";
import { prisma } from "@dadan/db";

@Injectable()
export class PrismaService implements OnModuleInit {
  readonly db = prisma;

  async onModuleInit() {
    await prisma.$connect();
  }
}
