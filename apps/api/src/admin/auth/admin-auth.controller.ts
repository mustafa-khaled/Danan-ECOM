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
import { AdminAuthService } from "./admin-auth.service";
import { AdminLoginDto } from "./dto/admin-login.dto";
import { AdminGuard } from "./guards/admin.guard";
import { CurrentAdmin } from "./decorators/current-admin.decorator";
import { AllowViewerWrite } from "./decorators/allow-viewer-write.decorator";
import type { AdminSession } from "@dadan/types";
import {
  ADMIN_COOKIE,
  cookieOptions,
  getClientIp,
} from "../../common/constants";

@Controller("admin/auth")
export class AdminAuthController {
  constructor(private readonly adminAuth: AdminAuthService) {}

  @Post("login")
  async login(
    @Body() dto: AdminLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = getClientIp(req);
    const { token, admin } = await this.adminAuth.login(dto.email, dto.password, ip);

    res.cookie(ADMIN_COOKIE, token, cookieOptions(24 * 60 * 60 * 1000));

    // The httpOnly cookie is the only token transport; never expose the JWT in the body.
    return admin;
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
    const token =
      req.headers.authorization?.replace(/^Bearer /, "") ??
      cookies?.[ADMIN_COOKIE];
    await this.adminAuth.logout(admin.adminId, getClientIp(req), token);
    res.clearCookie(ADMIN_COOKIE);
    return { success: true };
  }
}
