import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

export interface PaymentResult {
  success: boolean;
  providerReference?: string;
  failureCode?: string;
  failureMessage?: string;
}

type PaymentProvider = "mock" | "stripe";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly provider: PaymentProvider;
  private readonly stripe: Stripe | null;

  constructor(private readonly config: ConfigService) {
    const providerKey = config.get<string>("PAYMENT_PROVIDER_KEY");
    
    if (providerKey?.startsWith("sk_")) {
      this.provider = "stripe";
      this.stripe = new Stripe(providerKey);
      this.logger.log("Payment provider: Stripe");
    } else {
      this.provider = "mock";
      this.stripe = null;
      this.logger.warn("Payment provider: Mock (no real payments will be processed)");
    }
  }

  get providerName(): PaymentProvider {
    return this.provider;
  }

  async charge(
    token: string,
    amount: number,
    currency: string,
    metadata: Record<string, string>,
  ): Promise<PaymentResult> {
    if (this.provider === "stripe" && this.stripe) {
      return this.chargeStripe(token, amount, currency, metadata);
    }
    return this.chargeMock(token, amount, currency, metadata);
  }

  private async chargeStripe(
    token: string,
    amount: number,
    currency: string,
    metadata: Record<string, string>,
  ): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe!.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        payment_method: token,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
        metadata,
      });

      if (paymentIntent.status === "succeeded") {
        return {
          success: true,
          providerReference: paymentIntent.id,
        };
      }

      return {
        success: false,
        failureCode: paymentIntent.status,
        failureMessage: `Payment status: ${paymentIntent.status}`,
      };
    } catch (error) {
      const stripeError = error as Stripe.errors.StripeError;
      this.logger.error(`Stripe payment failed: ${stripeError.message}`);
      
      return {
        success: false,
        failureCode: stripeError.code ?? "STRIPE_ERROR",
        failureMessage: stripeError.message ?? "Payment processing failed",
      };
    }
  }

  private async chargeMock(
    token: string,
    amount: number,
    currency: string,
    metadata: Record<string, string>,
  ): Promise<PaymentResult> {
    if (token === "fail" || token.startsWith("fail_")) {
      return {
        success: false,
        failureCode: "PAYMENT_DECLINED",
        failureMessage: "Payment was declined",
      };
    }

    const ref = `mock_${Date.now()}_${metadata.clientId ?? "checkout"}`;
    this.logger.log(
      `Mock charge: ${amount} ${currency}, token=${token.slice(0, 8)}..., ref=${ref}`,
    );

    return {
      success: true,
      providerReference: ref,
    };
  }

  async refund(providerReference: string, amount?: number): Promise<PaymentResult> {
    if (this.provider === "stripe" && this.stripe) {
      try {
        const refund = await this.stripe.refunds.create({
          payment_intent: providerReference,
          amount: amount ? Math.round(amount * 100) : undefined,
        });

        return {
          success: refund.status === "succeeded",
          providerReference: refund.id,
        };
      } catch (error) {
        const stripeError = error as Stripe.errors.StripeError;
        this.logger.error(`Stripe refund failed: ${stripeError.message}`);
        
        return {
          success: false,
          failureCode: stripeError.code ?? "STRIPE_REFUND_ERROR",
          failureMessage: stripeError.message ?? "Refund processing failed",
        };
      }
    }

    this.logger.log(`Mock refund: ${providerReference}, amount=${amount ?? "full"}`);
    return {
      success: true,
      providerReference: `refund_${Date.now()}`,
    };
  }
}
