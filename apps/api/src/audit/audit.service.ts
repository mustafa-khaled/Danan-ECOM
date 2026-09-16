import { Injectable } from "@nestjs/common";
import { ActorType, Prisma } from "@dadan/db";
import { PrismaService } from "../prisma/prisma.service";

export interface AuditEntry {
  actorType: ActorType;
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditEntry) {
    return this.prisma.db.auditLog.create({
      data: {
        actorType: params.actorType,
        actorId: params.actorId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata,
        ipAddress: params.ipAddress,
      },
    });
  }

  /** One INSERT for a batch of entries, for callers that log per collection item. */
  async logMany(entries: AuditEntry[]) {
    if (entries.length === 0) return;
    await this.prisma.db.auditLog.createMany({
      data: entries.map((entry) => ({
        actorType: entry.actorType,
        actorId: entry.actorId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        metadata: entry.metadata,
        ipAddress: entry.ipAddress,
      })),
    });
  }
}
