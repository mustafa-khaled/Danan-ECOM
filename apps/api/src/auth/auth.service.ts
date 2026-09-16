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
  private readonly jwtSecret: string;
  /**
   * Hash of a value nobody can present, compared against on every failed
   * lookup so a key whose prefix matches no client costs the same as one whose
   * prefix does. Without it, response time reveals whether a prefix exists.
   */
  private readonly decoyHash: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
    private readonly refreshTokens: RefreshTokenService,
    config: ConfigService,
  ) {
    this.saltRounds = parseInt(config.get<string>("HOUSE_KEY_SALT") ?? "12", 10);
    this.jwtSecret = config.getOrThrow<string>("JWT_SECRET");
    this.decoyHash = bcrypt.hash(
      randomBytes(32).toString("hex"),
      this.saltRounds,
    );
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

    // H-06: Per-prefix rate limiting to prevent targeted brute-force
    const prefixRateLimitKey = `auth:prefix:${keyPrefix}`;
    const prefixLimited = await this.redis.isRateLimited(
      prefixRateLimitKey,
      RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW_SECONDS,
    );
    if (prefixLimited) {
      throw new HttpException("errors.TOO_MANY_REQUESTS", HttpStatus.TOO_MANY_REQUESTS);
    }

    const candidates = await this.prisma.db.client.findMany({
      where: {
        isActive: true,
        houseKeyPrefix: keyPrefix,
      },
      select: {
        id: true,
        houseKey: true,
        displayName: true,
        locale: true,
        classId: true,
        class: { select: { id: true, slug: true, name: true } },
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
      // Equalise the no-candidate path with the wrong-key path.
      await bcrypt.compare(normalizedKey, await this.decoyHash);
      throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
    }

    const tokens = await this.issueClientTokens(matched);
    await this.touchLastSeen(matched.id);

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
      include: { class: { select: { id: true, slug: true, name: true } } },
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
    await this.touchLastSeen(matched.id);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      client: this.toClientProfile({
        id: matched.id,
        displayName: matched.displayName,
        locale: matched.locale,
        class: matched.class,
      }),
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
        createdAt: true,
        class: { select: { id: true, slug: true, name: true } },
      },
    });

    if (!client) {
      throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
    }

    return client;
  }

  private touchLastSeen(clientId: string) {
    return this.prisma.db.client.update({
      where: { id: clientId },
      data: { lastSeenAt: new Date() },
    });
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
      locale: string;
      classId: string;
      class?: { id: string; slug: string; name: string };
    },
  ): Promise<ClientAuthTokens> {
    const membershipClass =
      matched.class ??
      (await this.prisma.db.class.findUniqueOrThrow({
        where: { id: matched.classId },
        select: { id: true, slug: true, name: true },
      }));
    const accessToken = await this.signClientAccessToken({
      id: matched.id,
      displayName: matched.displayName,
      classId: matched.classId,
    });
    const { token: refreshToken } = await this.refreshTokens.issueRefreshToken(
      JWT_AUDIENCE_CLIENT,
      matched.id,
      SESSION_DURATION_SECONDS,
    );

    return {
      accessToken,
      refreshToken,
      client: this.toClientProfile({
        id: matched.id,
        displayName: matched.displayName,
        locale: matched.locale,
        class: membershipClass,
      }),
    };
  }

  private async signClientAccessToken(matched: {
    id: string;
    displayName: string;
    classId: string;
  }): Promise<string> {
    const payload = {
      sub: matched.id,
      displayName: matched.displayName,
      classId: matched.classId,
      aud: JWT_AUDIENCE_CLIENT,
      jti: randomUUID(),
    };

    return this.jwt.signAsync(payload, {
      secret: this.jwtSecret,
      expiresIn: getAccessTokenSeconds(),
    });
  }

  private toClientProfile(matched: {
    id: string;
    displayName: string;
    locale: string;
    class: { id: string; slug: string; name: string };
  }): ValidateKeyResponse {
    return {
      clientId: matched.id,
      displayName: matched.displayName,
      class: matched.class,
      locale: matched.locale === "en" ? ("en" as const) : ("ar" as const),
    };
  }
}
