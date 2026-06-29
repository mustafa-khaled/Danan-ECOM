import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AdminSession } from "@dadan/types";
import type { Request } from "express";

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminSession => {
    const request = ctx.switchToHttp().getRequest<Request & { admin: AdminSession }>();
    return request.admin;
  },
);
