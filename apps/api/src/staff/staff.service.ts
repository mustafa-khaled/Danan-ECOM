import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import * as bcrypt from "bcrypt";
import { ActorType, AdminRole } from "@dadan/db";
import { AuditService } from "../audit/audit.service";
import { AdminAuthService } from "../admin/auth/admin-auth.service";
import { NotificationsService } from "../notifications/notifications.service";
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
  private readonly logger = new Logger(StaffService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly adminAuth: AdminAuthService,
    private readonly notifications: NotificationsService,
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
        mustChangePassword: true,
      },
      select: STAFF_SELECT,
    });

    // C-03: Send temporary password via email instead of returning in API response
    this.notifications.sendStaffCreatedEmail(email, {
      displayName: data.displayName,
      temporaryPassword,
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "STAFF_CREATED",
      targetType: "AdminUser",
      targetId: staff.id,
      ipAddress,
    });

    return staff;
  }

  async update(
    adminId: string,
    id: string,
    data: { displayName?: string; role?: AdminRole; isActive?: boolean },
    ipAddress?: string,
  ) {
    // C-01: SUPER_ADMINs cannot modify their own record
    if (adminId === id) {
      throw new ForbiddenException("errors.CANNOT_MODIFY_OWN_ADMIN_RECORD");
    }

    const existing = await this.prisma.db.adminUser.findUnique({
      where: { id },
      select: { id: true, role: true },
    });
    if (!existing) throw new NotFoundException("errors.STAFF_NOT_FOUND");

    // C-01: Prevent deactivating or demoting the last SUPER_ADMIN
    const isDemotion =
      existing.role === AdminRole.SUPER_ADMIN &&
      ((data.role !== undefined && data.role !== AdminRole.SUPER_ADMIN) ||
        data.isActive === false);

    if (isDemotion) {
      const superAdminCount = await this.prisma.db.adminUser.count({
        where: { role: AdminRole.SUPER_ADMIN, isActive: true },
      });
      if (superAdminCount <= 1) {
        throw new BadRequestException("errors.CANNOT_REMOVE_LAST_SUPER_ADMIN");
      }
    }

    const staff = await this.prisma.db.adminUser.update({
      where: { id },
      data,
      select: STAFF_SELECT,
    });

    // If the target admin was deactivated, revoke all their sessions
    if (data.isActive === false) {
      await this.adminAuth.revokeAllAdminSessions(id);
    }

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
