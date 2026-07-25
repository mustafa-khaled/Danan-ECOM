import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { Public } from "../common/decorators/public.decorator";
import { PaymentsService, TapCharge } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly payments: PaymentsService) {}

  /**
   * Tap Payments posts the full charge object here after asynchronous
   * processing (3DS, mada redirects, delayed captures). Signature-verified;
   * unsigned or tampered posts are rejected.
   */
  @Public()
  @Post("webhook")
  @HttpCode(200)
  async webhook(
    @Body() charge: TapCharge,
    @Headers("hashstring") hashstring?: string,
  ) {
    if (
      !hashstring ||
      !charge?.id ||
      !this.payments.verifyWebhookSignature(charge, hashstring)
    ) {
      this.logger.warn("Rejected payment webhook with invalid signature");
      throw new UnauthorizedException("errors.UNAUTHORIZED");
    }

    await this.payments.handleChargeEvent(charge);
    return { received: true };
  }
}
