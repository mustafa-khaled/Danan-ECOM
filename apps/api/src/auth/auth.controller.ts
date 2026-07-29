import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { ValidateKeyDto } from "./dto/validate-key.dto";
import { ClientGuard } from "./guards/client.guard";
import { CurrentClient } from "./decorators/current-client.decorator";
import { Public } from "../common/decorators/public.decorator";
import type { ClientSession } from "@dadan/types";
import {
  AUTH_FAILURE_MESSAGE,
  CLIENT_COOKIE,
  CLIENT_REFRESH_COOKIE,
  SESSION_DURATION_SECONDS,
  clearCookieOptions,
  cookieOptions,
  getAccessTokenSeconds,
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
    const { accessToken, refreshToken, client } = await this.authService.validateKey(
      dto.houseKey,
      ip,
    );

    res.cookie(
      CLIENT_COOKIE,
      accessToken,
      cookieOptions(getAccessTokenSeconds() * 1000),
    );
    res.cookie(
      CLIENT_REFRESH_COOKIE,
      refreshToken,
      cookieOptions(SESSION_DURATION_SECONDS * 1000),
    );

    // The httpOnly cookies are the only token transport; never expose JWTs in the body.
    return client;
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = req.cookies as Record<string, string> | undefined;
    const refreshToken = cookies?.[CLIENT_REFRESH_COOKIE];
    if (!refreshToken) {
      throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshSession(refreshToken);

    res.cookie(
      CLIENT_COOKIE,
      accessToken,
      cookieOptions(getAccessTokenSeconds() * 1000),
    );
    res.cookie(
      CLIENT_REFRESH_COOKIE,
      newRefreshToken,
      cookieOptions(SESSION_DURATION_SECONDS * 1000),
    );

    return { success: true };
  }

  @Post("logout")
  @UseGuards(ClientGuard)
  async logout(
    @CurrentClient() client: ClientSession,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as Record<string, string> | undefined;
    const accessToken =
      req.headers.authorization?.replace(/^Bearer /, "") ??
      cookies?.[CLIENT_COOKIE];
    const refreshToken = cookies?.[CLIENT_REFRESH_COOKIE];
    await this.authService.logout(
      client.clientId,
      getClientIp(req),
      accessToken,
      refreshToken,
    );
    res.clearCookie(CLIENT_COOKIE, clearCookieOptions());
    res.clearCookie(CLIENT_REFRESH_COOKIE, clearCookieOptions());
    return { success: true };
  }

  @Post("logout-all")
  @UseGuards(ClientGuard)
  async logoutAll(
    @CurrentClient() client: ClientSession,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as Record<string, string> | undefined;
    const accessToken =
      req.headers.authorization?.replace(/^Bearer /, "") ??
      cookies?.[CLIENT_COOKIE];
    await this.authService.logoutAll(client.clientId, getClientIp(req), accessToken);
    res.clearCookie(CLIENT_COOKIE, clearCookieOptions());
    res.clearCookie(CLIENT_REFRESH_COOKIE, clearCookieOptions());
    return { success: true };
  }

  @Get("me")
  @UseGuards(ClientGuard)
  getMe(@CurrentClient() client: ClientSession) {
    return this.authService.getMe(client.clientId);
  }
}
