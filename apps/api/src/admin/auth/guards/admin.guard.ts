import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import type { AdminSession } from "@dadan/types";
import type { AdminRole } from "@dadan/db";
import type { Request } from "express";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { ALLOW_VIEWER_WRITE_KEY } from "../decorators/allow-viewer-write.decorator";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisService } from "../../../redis/redis.service";
import {
  ADMIN_COOKIE,
  AUTH_FAILURE_MESSAGE,
  JWT_AUDIENCE_ADMIN,
  tokenDenyListKey,
} from "../../../common/constants";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { admin?: AdminSession }>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
    }

    const secret = this.config.getOrThrow<string>("ADMIN_JWT_SECRET");

    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        email: string;
        role: AdminRole;
        displayName: string;
        aud?: string;
        jti?: string;
      }>(token, { secret, algorithms: ["HS256"] });

      if (payload.aud !== JWT_AUDIENCE_ADMIN) {
        throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
      }

      if (payload.jti && (await this.redis.exists(tokenDenyListKey(payload.jti)))) {
        throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
      }

      // Re-check the admin in the DB so deactivation and role changes
      // (e.g. STAFF demoted to VIEWER) take effect immediately instead of
      // when the 24h JWT expires.
      const admin = await this.prisma.db.adminUser.findUnique({
        where: { id: payload.sub },
        select: { isActive: true, role: true, email: true, displayName: true },
      });
      if (!admin || !admin.isActive) {
        throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
      }
      const role = admin.role;

      request.admin = {
        adminId: payload.sub,
        email: admin.email,
        role,
        displayName: admin.displayName,
      };

      const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (requiredRoles?.length) {
        if (!requiredRoles.includes(role)) {
          throw new ForbiddenException("Insufficient permissions");
        }
      }

      // VIEWER is read-only: block all mutating requests unless explicitly exempted.
      if (role === "VIEWER" && !SAFE_METHODS.has(request.method)) {
        const allowViewerWrite = this.reflector.getAllAndOverride<boolean>(
          ALLOW_VIEWER_WRITE_KEY,
          [context.getHandler(), context.getClass()],
        );
        if (!allowViewerWrite) {
          throw new ForbiddenException("Insufficient permissions");
        }
      }

      return true;
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
    }
  }

  private extractToken(request: Request): string | undefined {
    const auth = request.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
      return auth.slice(7);
    }
    const cookies = request.cookies as Record<string, string> | undefined;
    return cookies?.[ADMIN_COOKIE];
  }
}
