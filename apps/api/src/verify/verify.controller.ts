import { Body, Controller, Get, Post, Query, Req } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { IsString, MaxLength, MinLength } from "class-validator";
import type { Request } from "express";
import { VerifyService } from "./verify.service";
import { CurrentLocale } from "../common/i18n/locale";
import { Public } from "../common/decorators/public.decorator";
import type { Locale } from "@dadan/types";
import { CLIENT_COOKIE, getClientIp } from "../common/constants";

class VerifyDto {
  @IsString() @MinLength(1) @MaxLength(64) serial!: string;
  @IsString() @MinLength(1) @MaxLength(128) token!: string;
}

@Public()
@Controller("verify")
export class VerifyController {
  constructor(
    private readonly verifyService: VerifyService,
    private readonly jwt: JwtService,
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

  /** Optionally attribute the verification to a logged-in client (signature-checked). */
  private async resolveClientId(req: Request): Promise<string | undefined> {
    const cookies = req.cookies as Record<string, string> | undefined;
    const session = cookies?.[CLIENT_COOKIE];
    if (!session) return undefined;
    try {
      const payload = await this.jwt.verifyAsync<{ sub?: string }>(session);
      return payload.sub;
    } catch {
      return undefined;
    }
  }
}
