import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { ClientSession } from "@dadan/types";
import type { Request } from "express";
import {
  AUTH_FAILURE_MESSAGE,
  CLIENT_COOKIE,
} from "../../common/constants";

@Injectable()
export class ClientGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

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
      }>(token);

      request.client = {
        clientId: payload.sub,
        displayName: payload.displayName,
        visibilityGroups: payload.visibilityGroups,
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
