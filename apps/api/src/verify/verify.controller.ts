import { Body, Controller, Get, Post, Query, Req } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { VerifyService } from "./verify.service";
import { CurrentLocale } from "../common/i18n/locale";
import { Public } from "../common/decorators/public.decorator";
import type { Locale } from "@dadan/types";
import { CLIENT_COOKIE, JWT_AUDIENCE_CLIENT, getClientIp } from "../common/constants";
import { VerifyDto } from "./dto/verify.dto";

@Public()
@Controller("verify")
export class VerifyController {
  constructor(
    private readonly verifyService: VerifyService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** GET is kept for QR-code links printed on certificates. */
  @Get()
  async handleVerifyGet(
    @Query() query: VerifyDto,
    @CurrentLocale() locale: Locale,
    @Req() req: Request,
  ) {
    return this.verifyService.verify(
      query.serial,
      query.token,
      getClientIp(req),
      await this.resolveClientId(req),
      locale,
    );
  }

  /** POST variant for the in-app verify form, keeping the token out of URLs. */
  @Post()
  async handleVerifyPost(
    @Body() dto: VerifyDto,
    @CurrentLocale() locale: Locale,
    @Req() req: Request,
  ) {
    return this.verifyService.verify(
      dto.serial,
      dto.token,
      getClientIp(req),
      await this.resolveClientId(req),
      locale,
    );
  }

  private async resolveClientId(req: Request): Promise<string | undefined> {
    const cookies = req.cookies as Record<string, string> | undefined;
    const session = cookies?.[CLIENT_COOKIE];
    if (!session) return undefined;
    try {
      // L-09: Specify secret and audience so admin tokens can't be misidentified
      const payload = await this.jwt.verifyAsync<{ sub?: string; aud?: string }>(
        session,
        {
          secret: this.config.get<string>("JWT_SECRET"),
          audience: JWT_AUDIENCE_CLIENT,
        },
      );
      return payload.sub;
    } catch {
      return undefined;
    }
  }
}
