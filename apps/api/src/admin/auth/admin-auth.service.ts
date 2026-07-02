import { randomUUID } from "node:crypto";
import { HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { ActorType } from "@dadan/db";
import { AuditService } from "../../audit/audit.service";
import { PrismaService } from "../../prisma/prisma.service";
import { RedisService } from "../../redis/redis.service";
import {
  AUTH_FAILURE_MESSAGE,
  JWT_AUDIENCE_ADMIN,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_SECONDS,
  tokenDenyListKey,
} from "../../common/constants";

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    private readonly redis: RedisService,
  ) {}

  async login(email: string, password: string, ipAddress: string) {
    const rateLimitKey = `admin:login:${ipAddress}`;
    const limited = await this.redis.isRateLimited(
      rateLimitKey,
      RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW_SECONDS,
    );
    if (limited) {
      throw new HttpException("Too many login attempts", HttpStatus.TOO_MANY_REQUESTS);
    }

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
        aud: JWT_AUDIENCE_ADMIN,
        jti: randomUUID(),
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

  async logout(adminId: string, ipAddress: string, token?: string) {
    if (token) {
      await this.revokeToken(token);
    }
    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "ADMIN_LOGOUT",
      targetType: "AdminUser",
      targetId: adminId,
      ipAddress,
    });
  }

  /** Deny-list the token's jti in Redis until its natural expiry. */
  private async revokeToken(token: string) {
    const payload = this.jwt.decode<{ jti?: string; exp?: number } | null>(token);
    if (!payload?.jti || !payload.exp) return;
    const remainingSeconds = payload.exp - Math.floor(Date.now() / 1000);
    if (remainingSeconds <= 0) return;
    await this.redis.setWithExpiry(
      tokenDenyListKey(payload.jti),
      "1",
      remainingSeconds,
    );
  }
}
