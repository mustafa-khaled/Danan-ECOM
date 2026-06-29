import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { ClientSession } from "@dadan/types";
import type { Request } from "express";

export const CurrentClient = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ClientSession => {
    const request = ctx.switchToHttp().getRequest<Request & { client: ClientSession }>();
    return request.client;
  },
);
