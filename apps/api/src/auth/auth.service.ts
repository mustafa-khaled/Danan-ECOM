import { randomBytes, randomUUID } from "node:crypto";
import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { ActorType } from "@dadan/db";
import type { ValidateKeyResponse } from "@dadan/types";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { RefreshTokenService } from "./refresh-token.service";
import {
  AUTH_FAILURE_MESSAGE,
  JWT_AUDIENCE_CLIENT,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_SECONDS,
  SESSION_DURATION_SECONDS,
  getAccessTokenSeconds,
  tokenDenyListKey,
} from "../common/constants";

export interface ClientAuthTokens {
  accessToken: string;
  refreshToken: string;
  client: ValidateKeyResponse;
}

@Injectable()
export class AuthService {
  private readonly saltRounds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
    private readonly refreshTokens: RefreshTokenService,
    config: ConfigService,
  ) {
    this.saltRounds = parseInt(config.get<string>("HOUSE_KEY_SALT") ?? "12", 10);
  }

  async validateKey(
    houseKey: string,
    ipAddress: string,
  ): Promise<ClientAuthTokens> {
    const rateLimitKey = `auth:validate-key:${ipAddress}`;
    const limited = await this.redis.isRateLimited(
      rateLimitKey,
      RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW_SECONDS,
    );
    if (limited) {
      throw new HttpException("errors.TOO_MANY_REQUESTS", HttpStatus.TOO_MANY_REQUESTS);
    }

    const normalizedKey = houseKey.trim();
    const keyPrefix = normalizedKey.slice(0, 4);

    const candidates = await this.prisma.db.client.findMany({
      where: {
        isActive: true,
        houseKeyPrefix: keyPrefix,
      },
    });

    let matched: (typeof candidates)[0] | null = null;
    for (const client of candidates) {
      const isMatch = await bcrypt.compare(normalizedKey, client.houseKey);
      if (isMatch) {
        matched = client;
        break;
      }
    }

    if (!matched) {
      throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
    }

    const tokens = await this.issueClientTokens(matched);

    await this.audit.log({
      actorType: ActorType.CLIENT,
      actorId: matched.id,
      action: "HOUSE_KEY_VALIDATED",
      targetType: "Client",
      targetId: matched.id,
      ipAddress,
    });

    return tokens;
  }

  async refreshSession(refreshToken: string): Promise<ClientAuthTokens> {
    const resolved = await this.refreshTokens.resolveRefreshToken(
      refreshToken,
      JWT_AUDIENCE_CLIENT,
    );
    if (!resolved) {
      throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
    }

    const matched = await this.prisma.db.client.findFirst({
      where: { id: resolved.sub, isActive: true },
    });

    if (!matched) {
      throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
    }

    const { token: newRefreshToken } = await this.refreshTokens.rotateRefreshToken(
      refreshToken,
      JWT_AUDIENCE_CLIENT,
      SESSION_DURATION_SECONDS,
    );

    const accessToken = await this.signClientAccessToken(matched);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      client: this.toClientProfile(matched),
    };
  }

  async logoutAll(clientId: string, ipAddress: string, accessToken?: string) {
    if (accessToken) {
      await this.revokeAccessToken(accessToken);
    }
    await this.refreshTokens.revokeAllForSubject(
      JWT_AUDIENCE_CLIENT,
      clientId,
      SESSION_DURATION_SECONDS,
    );
    await this.audit.log({
      actorType: ActorType.CLIENT,
      actorId: clientId,
      action: "HOUSE_KEY_LOGOUT_ALL",
      targetType: "Client",
      targetId: clientId,
      ipAddress,
    });
  }

  async revokeAllClientSessions(clientId: string): Promise<void> {
    await this.refreshTokens.revokeAllForSubject(
      JWT_AUDIENCE_CLIENT,
      clientId,
      SESSION_DURATION_SECONDS,
    );
  }

  async logout(
    clientId: string,
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
        JWT_AUDIENCE_CLIENT,
        SESSION_DURATION_SECONDS,
      );
    }
    await this.audit.log({
      actorType: ActorType.CLIENT,
      actorId: clientId,
      action: "HOUSE_KEY_LOGOUT",
      targetType: "Client",
      targetId: clientId,
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

  async getMe(clientId: string) {
    const client = await this.prisma.db.client.findFirst({
      where: { id: clientId, isActive: true },
      select: {
        id: true,
        displayName: true,
        email: true,
        phone: true,
        locale: true,
        visibilityGroups: true,
        createdAt: true,
      },
    });

    if (!client) {
      throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
    }

    return client;
  }

  hashHouseKey(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  generateHouseKey(): string {
    return randomBytes(16).toString("hex");
  }

  async findClientByHouseKey(houseKey: string, excludeClientId?: string) {
    const normalizedKey = houseKey.trim();
    const keyPrefix = normalizedKey.slice(0, 4);

    const candidates = await this.prisma.db.client.findMany({
      where: {
        isActive: true,
        houseKeyPrefix: keyPrefix,
        ...(excludeClientId ? { id: { not: excludeClientId } } : {}),
      },
    });

    for (const client of candidates) {
      const isMatch = await bcrypt.compare(normalizedKey, client.houseKey);
      if (isMatch) return client;
    }
    return null;
  }

  private async issueClientTokens(
    matched: {
      id: string;
      displayName: string;
      visibilityGroups: string[];
      locale: string;
    },
  ): Promise<ClientAuthTokens> {
    const accessToken = await this.signClientAccessToken(matched);
    const { token: refreshToken } = await this.refreshTokens.issueRefreshToken(
      JWT_AUDIENCE_CLIENT,
      matched.id,
      SESSION_DURATION_SECONDS,
    );

    return {
      accessToken,
      refreshToken,
      client: this.toClientProfile(matched),
    };
  }

  private async signClientAccessToken(matched: {
    id: string;
    displayName: string;
    visibilityGroups: string[];
  }): Promise<string> {
    const payload = {
      sub: matched.id,
      displayName: matched.displayName,
      visibilityGroups: matched.visibilityGroups,
      aud: JWT_AUDIENCE_CLIENT,
      jti: randomUUID(),
    };

    return this.jwt.signAsync(payload, {
      expiresIn: getAccessTokenSeconds(),
    });
  }

  private toClientProfile(matched: {
    id: string;
    displayName: string;
    visibilityGroups: string[];
    locale: string;
  }): ValidateKeyResponse {
    return {
      clientId: matched.id,
      displayName: matched.displayName,
      visibilityGroups: matched.visibilityGroups,
      locale: matched.locale === "en" ? ("en" as const) : ("ar" as const),
    };
  }
}
