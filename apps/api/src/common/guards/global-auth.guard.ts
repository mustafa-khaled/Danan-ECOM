import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { GUARDS_METADATA } from "@nestjs/common/constants";
import { Reflector } from "@nestjs/core";
import { AUTH_FAILURE_MESSAGE } from "../constants";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

/**
 * Default-deny safety net. Every route must either:
 *  - be explicitly marked @Public(), or
 *  - declare its own auth guard (ClientGuard/AdminGuard) via @UseGuards.
 *
 * A newly added controller without either is rejected instead of being
 * silently exposed — the PRD forbids any public browsing surface.
 */
@Injectable()
export class GlobalAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const hasHandlerGuards =
      (Reflect.getMetadata(GUARDS_METADATA, context.getHandler()) ?? []).length > 0;
    const hasClassGuards =
      (Reflect.getMetadata(GUARDS_METADATA, context.getClass()) ?? []).length > 0;
    if (hasHandlerGuards || hasClassGuards) return true;

    throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
  }
}
