import { randomUUID } from "node:crypto";
import { HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { ActorType } from "@dadan/db";
import { AuditService } from "../../audit/audit.service";
import { PrismaService } from "../../prisma/prisma.service";
import { RedisService } from "../../redis/redis.service";
import { RefreshTokenService } from "../../auth/refresh-token.service";
import {
  AUTH_FAILURE_MESSAGE,
  JWT_AUDIENCE_ADMIN,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_SECONDS,
  getAccessTokenSeconds,
  getAdminRefreshSeconds,
  tokenDenyListKey,
} from "../../common/constants";

export interface AdminAuthTokens {
  accessToken: string;
  refreshToken: string;
  admin: {
    adminId: string;
    email: string;
    role: string;
    displayName: string;
  };
}

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    private readonly redis: RedisService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  async login(email: string, password: string, ipAddress: string): Promise<AdminAuthTokens> {
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

    const tokens = await this.issueAdminTokens(admin);

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: admin.id,
      action: "ADMIN_LOGIN",
      targetType: "AdminUser",
      targetId: admin.id,
      ipAddress,
    });

    return tokens;
  }

  async refreshSession(refreshToken: string): Promise<AdminAuthTokens> {
    const refreshTtl = getAdminRefreshSeconds();
    const resolved = await this.refreshTokens.resolveRefreshToken(
      refreshToken,
      JWT_AUDIENCE_ADMIN,
    );
    if (!resolved) {
      throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
    }

    const admin = await this.prisma.db.adminUser.findUnique({
      where: { id: resolved.sub },
    });

    if (!admin?.isActive) {
      throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
    }

    const { token: newRefreshToken } = await this.refreshTokens.rotateRefreshToken(
      refreshToken,
      JWT_AUDIENCE_ADMIN,
      refreshTtl,
    );

    const accessToken = await this.signAdminAccessToken(admin);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      admin: {
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
        displayName: admin.displayName,
      },
    };
  }

  async logoutAll(adminId: string, ipAddress: string, accessToken?: string) {
    if (accessToken) {
      await this.revokeAccessToken(accessToken);
    }
    await this.refreshTokens.revokeAllForSubject(
      JWT_AUDIENCE_ADMIN,
      adminId,
      getAdminRefreshSeconds(),
    );
    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "ADMIN_LOGOUT_ALL",
      targetType: "AdminUser",
      targetId: adminId,
      ipAddress,
    });
  }

  async revokeAllAdminSessions(adminId: string): Promise<void> {
    await this.refreshTokens.revokeAllForSubject(
      JWT_AUDIENCE_ADMIN,
      adminId,
      getAdminRefreshSeconds(),
    );
  }

  async logout(
    adminId: string,
    ipAddress: string,
    accessToken?: string,
    refreshToken?: string,
  ) {
    if (accessToken) {
      await this.revokeAccessToken(accessToken);
    }
    if (refreshToken) {
      await this.refreshTokens.revokeRefreshToken(
        refreshToken,
        JWT_AUDIENCE_ADMIN,
        getAdminRefreshSeconds(),
      );
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

  /** Deny-list the access token's jti in Redis until its natural expiry. */
  private async revokeAccessToken(token: string) {
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

  private async issueAdminTokens(admin: {
    id: string;
    email: string;
    role: string;
    displayName: string;
  }): Promise<AdminAuthTokens> {
    const accessToken = await this.signAdminAccessToken(admin);
    const { token: refreshToken } = await this.refreshTokens.issueRefreshToken(
      JWT_AUDIENCE_ADMIN,
      admin.id,
      getAdminRefreshSeconds(),
    );

    return {
      accessToken,
      refreshToken,
      admin: {
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
        displayName: admin.displayName,
      },
    };
  }

  private async signAdminAccessToken(admin: {
    id: string;
    email: string;
    role: string;
    displayName: string;
  }): Promise<string> {
    return this.jwt.signAsync(
      {
        sub: admin.id,
        email: admin.email,
        role: admin.role,
        displayName: admin.displayName,
        aud: JWT_AUDIENCE_ADMIN,
        jti: randomUUID(),
      },
      { expiresIn: getAccessTokenSeconds() },
    );
  }
}
