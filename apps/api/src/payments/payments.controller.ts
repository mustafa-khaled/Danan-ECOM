import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { Public } from "../common/decorators/public.decorator";
import { PaymentsService, isTapChargeEvent } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly payments: PaymentsService) {}

  /**
   * Tap Payments posts the full charge object here after asynchronous
   * processing (3DS, mada redirects, delayed captures). Signature-verified;
   * unsigned or tampered posts are rejected.
   *
   * Exempt from the global throttler: Tap retries a failed delivery only twice
   * before marking the post as ERROR, so a 429 during a burst of concurrent
   * captures would be unrecoverable. The `hashstring` HMAC is the real gate.
   */
  @Public()
  @SkipThrottle()
  @Post("webhook")
  @HttpCode(200)
  async webhook(
    @Body() body: unknown,
    @Headers("hashstring") hashstring?: string,
  ) {
    if (!hashstring || !isTapChargeEvent(body)) {
      this.logger.warn("Rejected payment webhook with a malformed or unsigned body");
      throw new UnauthorizedException("errors.UNAUTHORIZED");
    }

    if (!this.payments.verifyWebhookSignature(body, hashstring)) {
      this.logger.warn("Rejected payment webhook with invalid signature");
      throw new UnauthorizedException("errors.UNAUTHORIZED");
    }

    await this.payments.handleChargeEvent(body);
    return { received: true };
  }
}
