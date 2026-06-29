import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import type { AdminSession } from "@dadan/types";
import type { AdminRole } from "@dadan/db";
import type { Request } from "express";
import { ROLES_KEY } from "../decorators/roles.decorator";
import {
  ADMIN_COOKIE,
  AUTH_FAILURE_MESSAGE,
} from "../../../common/constants";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { admin?: AdminSession }>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
    }

    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        email: string;
        role: AdminRole;
        displayName: string;
      }>(token);

      request.admin = {
        adminId: payload.sub,
        email: payload.email,
        role: payload.role,
        displayName: payload.displayName,
      };

      const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (requiredRoles?.length) {
        if (!requiredRoles.includes(payload.role)) {
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
