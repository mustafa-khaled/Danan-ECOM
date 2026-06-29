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

    return { ...client, token };
  }

  @Post("logout")
  @UseGuards(ClientGuard)
  async logout(
    @CurrentClient() client: ClientSession,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(client.clientId, getClientIp(req));
    res.clearCookie(CLIENT_COOKIE);
    return { success: true };
  }

  @Get("me")
  @UseGuards(ClientGuard)
  getMe(@CurrentClient() client: ClientSession) {
    return this.authService.getMe(client.clientId);
  }
}
