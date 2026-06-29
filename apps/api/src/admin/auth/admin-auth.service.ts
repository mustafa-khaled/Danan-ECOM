import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { ActorType } from "@dadan/db";
import { AuditService } from "../../audit/audit.service";
import { PrismaService } from "../../prisma/prisma.service";
import { AUTH_FAILURE_MESSAGE } from "../../common/constants";

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async login(email: string, password: string, ipAddress: string) {
    const admin = await this.prisma.db.adminUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!admin?.isActive) {
      throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
    }

    const token = await this.jwt.signAsync(
      {
        sub: admin.id,
        email: admin.email,
        role: admin.role,
        displayName: admin.displayName,
      },
      { expiresIn: 24 * 60 * 60 },
    );

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: admin.id,
      action: "ADMIN_LOGIN",
      targetType: "AdminUser",
      targetId: admin.id,
      ipAddress,
    });

    return {
      token,
      admin: {
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
        displayName: admin.displayName,
      },
    };
  }

  async logout(adminId: string, ipAddress: string) {
    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "ADMIN_LOGOUT",
      targetType: "AdminUser",
      targetId: adminId,
      ipAddress,
    });
  }
}
