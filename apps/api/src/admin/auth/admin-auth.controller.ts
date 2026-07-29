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
import { AdminAuthService } from "./admin-auth.service";
import { AdminLoginDto } from "./dto/admin-login.dto";
import { AdminGuard } from "./guards/admin.guard";
import { CurrentAdmin } from "./decorators/current-admin.decorator";
import { AllowViewerWrite } from "./decorators/allow-viewer-write.decorator";
import { Public } from "../../common/decorators/public.decorator";
import type { AdminSession } from "@dadan/types";
import {
  ADMIN_COOKIE,
  ADMIN_REFRESH_COOKIE,
  AUTH_FAILURE_MESSAGE,
  clearCookieOptions,
  cookieOptions,
  getAccessTokenSeconds,
  getAdminRefreshSeconds,
  getClientIp,
} from "../../common/constants";

@Controller("admin/auth")
export class AdminAuthController {
  constructor(private readonly adminAuth: AdminAuthService) {}

  @Public()
  @Post("login")
  async login(
    @Body() dto: AdminLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = getClientIp(req);
    const { accessToken, refreshToken, admin } = await this.adminAuth.login(
      dto.email,
      dto.password,
      ip,
    );

    res.cookie(
      ADMIN_COOKIE,
      accessToken,
      cookieOptions(getAccessTokenSeconds() * 1000),
    );
    res.cookie(
      ADMIN_REFRESH_COOKIE,
      refreshToken,
      cookieOptions(getAdminRefreshSeconds() * 1000),
    );

    // The httpOnly cookies are the only token transport; never expose JWTs in the body.
    return admin;
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = req.cookies as Record<string, string> | undefined;
    const refreshToken = cookies?.[ADMIN_REFRESH_COOKIE];
    if (!refreshToken) {
      throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.adminAuth.refreshSession(refreshToken);

    res.cookie(
      ADMIN_COOKIE,
      accessToken,
      cookieOptions(getAccessTokenSeconds() * 1000),
    );
    res.cookie(
      ADMIN_REFRESH_COOKIE,
      newRefreshToken,
      cookieOptions(getAdminRefreshSeconds() * 1000),
    );

    return { success: true };
  }

  @Get("me")
  @UseGuards(AdminGuard)
  getMe(@CurrentAdmin() admin: AdminSession) {
    return admin;
  }

  @Post("logout")
  @UseGuards(AdminGuard)
  @AllowViewerWrite()
  async logout(
    @CurrentAdmin() admin: AdminSession,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as Record<string, string> | undefined;
    const accessToken =
      req.headers.authorization?.replace(/^Bearer /, "") ??
      cookies?.[ADMIN_COOKIE];
    const refreshToken = cookies?.[ADMIN_REFRESH_COOKIE];
    await this.adminAuth.logout(
      admin.adminId,
      getClientIp(req),
      accessToken,
      refreshToken,
    );
    res.clearCookie(ADMIN_COOKIE, clearCookieOptions());
    res.clearCookie(ADMIN_REFRESH_COOKIE, clearCookieOptions());
    return { success: true };
  }

  @Post("logout-all")
  @UseGuards(AdminGuard)
  @AllowViewerWrite()
  async logoutAll(
    @CurrentAdmin() admin: AdminSession,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as Record<string, string> | undefined;
    const accessToken =
      req.headers.authorization?.replace(/^Bearer /, "") ??
      cookies?.[ADMIN_COOKIE];
    await this.adminAuth.logoutAll(admin.adminId, getClientIp(req), accessToken);
    res.clearCookie(ADMIN_COOKIE, clearCookieOptions());
    res.clearCookie(ADMIN_REFRESH_COOKIE, clearCookieOptions());
    return { success: true };
  }
}
