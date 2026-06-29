import { Controller, Get, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { VerifyService } from "./verify.service";
import { getClientIp } from "../common/constants";

@Controller("verify")
export class VerifyController {
  constructor(private readonly verifyService: VerifyService) {}

  @Get()
  handleVerify(
    @Query("serial") serial: string,
    @Query("token") token: string,
    @Req() req: Request,
  ) {
    const cookies = req.cookies as Record<string, string> | undefined;
    let clientId: string | undefined;
    if (cookies?.dadan_session) {
      try {
        const payload = JSON.parse(
          Buffer.from(cookies.dadan_session.split(".")[1]!, "base64url").toString(),
        ) as { sub?: string };
        clientId = payload.sub;
      } catch {
        clientId = undefined;
      }
    }

    return this.verifyService.verify(serial, token, getClientIp(req), clientId);
  }
}
