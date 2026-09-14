import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import * as bcrypt from "bcrypt";
import { ActorType, AdminRole } from "@dadan/db";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";

const STAFF_SELECT = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.prisma.db.adminUser.findMany({
      orderBy: { createdAt: "desc" },
      select: STAFF_SELECT,
    });
  }

  async create(
    adminId: string,
    data: { email: string; displayName: string; role: AdminRole },
    ipAddress?: string,
  ) {
    const email = data.email.toLowerCase().trim();
    const exists = await this.prisma.db.adminUser.findUnique({ where: { email } });
    if (exists) throw new ConflictException("errors.EMAIL_ALREADY_EXISTS");

    const temporaryPassword = randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const staff = await this.prisma.db.adminUser.create({
      data: {
        email,
        displayName: data.displayName,
        role: data.role,
        passwordHash,
      },
      select: STAFF_SELECT,
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "STAFF_CREATED",
      targetType: "AdminUser",
      targetId: staff.id,
      ipAddress,
    });

    return { ...staff, temporaryPassword };
  }

  async update(
    adminId: string,
    id: string,
    data: { displayName?: string; role?: AdminRole; isActive?: boolean },
    ipAddress?: string,
  ) {
    const existing = await this.prisma.db.adminUser.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException("errors.STAFF_NOT_FOUND");

    const staff = await this.prisma.db.adminUser.update({
      where: { id },
      data,
      select: STAFF_SELECT,
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "STAFF_UPDATED",
      targetType: "AdminUser",
      targetId: id,
      metadata: data,
      ipAddress,
    });

    return staff;
  }
}
