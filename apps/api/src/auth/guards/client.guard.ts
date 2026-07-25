import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { ClientSession } from "@dadan/types";
import type { Request } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import { RedisService } from "../../redis/redis.service";
import {
  AUTH_FAILURE_MESSAGE,
  CLIENT_COOKIE,
  JWT_AUDIENCE_CLIENT,
  tokenDenyListKey,
} from "../../common/constants";

@Injectable()
export class ClientGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { client?: ClientSession }>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
    }

    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        displayName: string;
        visibilityGroups: string[];
        aud?: string;
        jti?: string;
      }>(token);

      if (payload.aud !== JWT_AUDIENCE_CLIENT) {
        throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
      }

      if (payload.jti && (await this.redis.exists(tokenDenyListKey(payload.jti)))) {
        throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
      }

      // Re-check the client in the DB so deactivation and visibility-group
      // changes take effect immediately instead of when the JWT expires.
      const client = await this.prisma.db.client.findUnique({
        where: { id: payload.sub },
        select: {
          isActive: true,
          displayName: true,
          visibilityGroups: true,
          locale: true,
        },
      });
      if (!client || !client.isActive) {
        throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
      }

      request.client = {
        clientId: payload.sub,
        displayName: client.displayName,
        visibilityGroups: client.visibilityGroups,
        locale: client.locale === "en" ? "en" : "ar",
      };
      return true;
    } catch {
      throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
    }
  }

  private extractToken(request: Request): string | undefined {
    const auth = request.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
      return auth.slice(7);
    }
    const cookies = request.cookies as Record<string, string> | undefined;
    return cookies?.[CLIENT_COOKIE];
  }
}
