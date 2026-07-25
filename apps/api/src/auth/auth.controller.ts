import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { ValidateKeyDto } from "./dto/validate-key.dto";
import { ClientGuard } from "./guards/client.guard";
import { CurrentClient } from "./decorators/current-client.decorator";
import { Public } from "../common/decorators/public.decorator";
import type { ClientSession } from "@dadan/types";
import {
  CLIENT_COOKIE,
  SESSION_DURATION_SECONDS,
  cookieOptions,
  getClientIp,
} from "../common/constants";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("validate-key")
  async validateKey(
    @Body() dto: ValidateKeyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = getClientIp(req);
    const { token, client } = await this.authService.validateKey(dto.houseKey, ip);

    res.cookie(
      CLIENT_COOKIE,
      token,
      cookieOptions(SESSION_DURATION_SECONDS * 1000),
    );

    // The httpOnly cookie is the only token transport; never expose the JWT in the body.
    return client;
  }

  @Post("logout")
  @UseGuards(ClientGuard)
  async logout(
    @CurrentClient() client: ClientSession,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as Record<string, string> | undefined;
    const token =
      req.headers.authorization?.replace(/^Bearer /, "") ??
      cookies?.[CLIENT_COOKIE];
    await this.authService.logout(client.clientId, getClientIp(req), token);
    res.clearCookie(CLIENT_COOKIE);
    return { success: true };
  }

  @Get("me")
  @UseGuards(ClientGuard)
  getMe(@CurrentClient() client: ClientSession) {
    return this.authService.getMe(client.clientId);
  }
}
