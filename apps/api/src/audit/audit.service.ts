import { Injectable } from "@nestjs/common";
import { ActorType, Prisma } from "@dadan/db";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    actorType: ActorType;
    actorId: string;
    action: string;
    targetType?: string;
    targetId?: string;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string;
  }) {
    const { ipAddress, ...rest } = params;
    return this.prisma.db.auditLog.create({
      data: {
        ...rest,
        metadata: ipAddress
          ? { ...(params.metadata as object), ipAddress }
          : params.metadata,
      },
    });
  }
}
