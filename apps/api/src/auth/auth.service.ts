import { randomBytes } from "node:crypto";
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
import {
  AUTH_FAILURE_MESSAGE,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_SECONDS,
  SESSION_DURATION_SECONDS,
} from "../common/constants";

@Injectable()
export class AuthService {
  private readonly saltRounds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
    config: ConfigService,
  ) {
    this.saltRounds = parseInt(config.get<string>("HOUSE_KEY_SALT") ?? "12", 10);
  }

  async validateKey(
    houseKey: string,
    ipAddress: string,
  ): Promise<{ token: string; client: ValidateKeyResponse }> {
    const rateLimitKey = `auth:validate-key:${ipAddress}`;
    const limited = await this.redis.isRateLimited(
      rateLimitKey,
      RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW_SECONDS,
    );
    if (limited) {
      throw new HttpException("Too many attempts", HttpStatus.TOO_MANY_REQUESTS);
    }

    const normalizedKey = houseKey.trim();
    const clients = await this.prisma.db.client.findMany({
      where: { isActive: true },
    });

    let matched: (typeof clients)[0] | null = null;
    for (const client of clients) {
      const isMatch = await bcrypt.compare(normalizedKey, client.houseKey);
      if (isMatch) {
        matched = client;
        break;
      }
    }

    if (!matched) {
      throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
    }

    const payload = {
      sub: matched.id,
      displayName: matched.displayName,
      visibilityGroups: matched.visibilityGroups,
    };

    const token = await this.jwt.signAsync(payload, {
      expiresIn: SESSION_DURATION_SECONDS,
    });

    await this.audit.log({
      actorType: ActorType.CLIENT,
      actorId: matched.id,
      action: "HOUSE_KEY_VALIDATED",
      targetType: "Client",
      targetId: matched.id,
      ipAddress,
    });

    return {
      token,
      client: {
        clientId: matched.id,
        displayName: matched.displayName,
        visibilityGroups: matched.visibilityGroups,
      },
    };
  }

  async logout(clientId: string, ipAddress: string) {
    await this.audit.log({
      actorType: ActorType.CLIENT,
      actorId: clientId,
      action: "HOUSE_KEY_LOGOUT",
      targetType: "Client",
      targetId: clientId,
      ipAddress,
    });
  }

  async getMe(clientId: string) {
    const client = await this.prisma.db.client.findUnique({
      where: { id: clientId },
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

    if (!client || !(await this.prisma.db.client.findFirst({
      where: { id: clientId, isActive: true },
    }))) {
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
    const clients = await this.prisma.db.client.findMany({
      where: {
        isActive: true,
        ...(excludeClientId ? { id: { not: excludeClientId } } : {}),
      },
    });

    for (const client of clients) {
      const isMatch = await bcrypt.compare(normalizedKey, client.houseKey);
      if (isMatch) return client;
    }
    return null;
  }
}
