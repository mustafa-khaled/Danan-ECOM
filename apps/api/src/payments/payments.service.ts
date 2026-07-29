import { createHmac, timingSafeEqual } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ActorType, OrderStatus } from "@dadan/db";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";

export interface PaymentResult {
  success: boolean;
  providerReference?: string;
  failureCode?: string;
  failureMessage?: string;
}

export type PaymentMethod = "CARD" | "MADA" | "APPLE_PAY";

export interface ChargeParams {
  /** Tap token (tok_...) or saved source id from the frontend SDK. */
  token: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  idempotencyKey?: string;
  customer: { name: string; email: string };
  metadata: Record<string, string>;
}

/** Subset of the Tap charge object used by this service. */
export interface TapCharge {
  id: string;
  status: string;
  amount: number;
  currency: string;
  response?: { code?: string; message?: string };
  transaction?: { url?: string; created?: string };
  reference?: { gateway?: string; payment?: string };
  metadata?: Record<string, string>;
}

type PaymentProvider = "mock" | "tap";

const TAP_API_BASE = "https://api.tap.company/v2";

/** Charge states Tap treats as terminal failures. */
const TAP_FAILURE_STATUSES = new Set([
  "FAILED",
  "DECLINED",
  "CANCELLED",
  "ABANDONED",
  "RESTRICTED",
  "TIMEDOUT",
  "VOID",
  "UNKNOWN",
]);

/** ISO 4217 minor-unit digits; Tap formats webhook amounts with these. */
const THREE_DECIMAL_CURRENCIES = new Set(["KWD", "BHD", "OMR"]);

function currencyDecimals(currency: string): number {
  return THREE_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 3 : 2;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly provider: PaymentProvider;
  private readonly secretKey: string | undefined;
  private readonly webhookSecret: string | undefined;
  private readonly webhookUrl: string | undefined;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {
    const providerKey = config.get<string>("PAYMENT_PROVIDER_KEY");

    if (providerKey?.startsWith("sk_")) {
      this.provider = "tap";
      this.secretKey = providerKey;
      this.logger.log("Payment provider: Tap Payments");
    } else {
      this.provider = "mock";
      this.secretKey = undefined;
      this.logger.warn("Payment provider: Mock (no real payments will be processed)");
    }

    // Tap signs webhooks with the merchant secret API key by default;
    // PAYMENT_PROVIDER_SECRET can override it if a dedicated secret is configured.
    this.webhookSecret =
      config.get<string>("PAYMENT_PROVIDER_SECRET") || this.secretKey;
    this.webhookUrl = config.get<string>("PAYMENT_WEBHOOK_URL") || undefined;
  }

  get providerName(): PaymentProvider {
    return this.provider;
  }

  async charge(params: ChargeParams): Promise<PaymentResult> {
    if (this.provider === "tap") {
      return this.chargeTap(params);
    }
    return this.chargeMock(params);
  }

  private async chargeTap(params: ChargeParams): Promise<PaymentResult> {
    const [firstName, ...rest] = params.customer.name.trim().split(/\s+/);
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      };
      if (params.idempotencyKey) {
        headers["Idempotency-Key"] = params.idempotencyKey;
      }

      const response = await fetch(`${TAP_API_BASE}/charges`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          amount: params.amount,
          currency: params.currency.toUpperCase(),
          // Token charges are confirmed synchronously; the redirect/3DS flow
          // requires frontend integration with Tap's SDK.
          threeDSecure: false,
          save_card: false,
          description: "DADAN Dijital purchase",
          statement_descriptor: "DADAN",
          metadata: { ...params.metadata, paymentMethod: params.paymentMethod },
          customer: {
            first_name: firstName ?? "DADAN",
            last_name: rest.join(" ") || undefined,
            email: params.customer.email,
          },
          source: { id: params.token },
          ...(this.webhookUrl ? { post: { url: this.webhookUrl } } : {}),
        }),
      });

      const charge = (await response.json()) as TapCharge & {
        errors?: { code?: string; description?: string }[];
      };

      if (!response.ok) {
        const error = charge.errors?.[0];
        this.logger.error(
          `Tap charge failed (HTTP ${response.status}): ${error?.description ?? "unknown"}`,
        );
        return {
          success: false,
          failureCode: error?.code ?? `HTTP_${response.status}`,
          failureMessage: error?.description,
        };
      }

      if (charge.status === "CAPTURED") {
        return { success: true, providerReference: charge.id };
      }

      this.logger.warn(`Tap charge ${charge.id} not captured: ${charge.status}`);
      return {
        success: false,
        providerReference: charge.id,
        failureCode: charge.status,
        failureMessage: charge.response?.message,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Tap charge request failed: ${message}`);
      return {
        success: false,
        failureCode: "TAP_REQUEST_FAILED",
      };
    }
  }

  private chargeMock(params: ChargeParams): PaymentResult {
    if (params.token === "fail" || params.token.startsWith("fail_")) {
      return {
        success: false,
        failureCode: "PAYMENT_DECLINED",
        failureMessage: "Payment was declined",
      };
    }

    const ref = `mock_${Date.now()}_${params.metadata.clientId ?? "checkout"}`;
    this.logger.log(
      `Mock charge: ${params.amount} ${params.currency} via ${params.paymentMethod}, ` +
        `token=${params.token.slice(0, 8)}..., ref=${ref}`,
    );

    return { success: true, providerReference: ref };
  }

  async refund(
    providerReference: string,
    amount: number,
    currency: string,
  ): Promise<PaymentResult> {
    if (this.provider === "tap") {
      try {
        const response = await fetch(`${TAP_API_BASE}/refunds`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            charge_id: providerReference,
            amount,
            currency: currency.toUpperCase(),
            reason: "requested_by_customer",
          }),
        });

        const refund = (await response.json()) as {
          id?: string;
          status?: string;
          errors?: { code?: string; description?: string }[];
        };

        if (!response.ok) {
          const error = refund.errors?.[0];
          this.logger.error(
            `Tap refund failed (HTTP ${response.status}): ${error?.description ?? "unknown"}`,
          );
          return {
            success: false,
            failureCode: error?.code ?? `HTTP_${response.status}`,
            failureMessage: error?.description,
          };
        }

        return {
          success: refund.status === "REFUNDED" || refund.status === "PENDING",
          providerReference: refund.id,
          failureCode: refund.status,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Tap refund request failed: ${message}`);
        return { success: false, failureCode: "TAP_REQUEST_FAILED" };
      }
    }

    this.logger.log(`Mock refund: ${providerReference}, amount=${amount} ${currency}`);
    return { success: true, providerReference: `refund_${Date.now()}` };
  }

  /**
   * Validates Tap's `hashstring` header: HMAC-SHA256 over the concatenation of
   * x_id, x_amount, x_currency, x_gateway_reference, x_payment_reference,
   * x_status and x_created, keyed with the merchant secret.
   * See https://developers.tap.company/docs/webhook
   */
  verifyWebhookSignature(charge: TapCharge, hashstring: string): boolean {
    if (!this.webhookSecret) return false;

    const amount = charge.amount.toFixed(currencyDecimals(charge.currency));
    const toHash =
      `x_id${charge.id}` +
      `x_amount${amount}` +
      `x_currency${charge.currency}` +
      `x_gateway_reference${charge.reference?.gateway ?? ""}` +
      `x_payment_reference${charge.reference?.payment ?? ""}` +
      `x_status${charge.status}` +
      `x_created${charge.transaction?.created ?? ""}`;

    const expected = createHmac("sha256", this.webhookSecret)
      .update(toHash)
      .digest("hex");

    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(hashstring));
    } catch {
      return false;
    }
  }

  /**
   * Reconciles an order against an asynchronous Tap charge event.
   * Idempotent: repeated webhooks for the same terminal state are no-ops.
   */
  async handleChargeEvent(charge: TapCharge): Promise<void> {
    const order = await this.prisma.db.order.findFirst({
      where: { paymentReference: charge.id },
    });

    await this.audit.log({
      actorType: ActorType.SYSTEM,
      actorId: "tap-webhook",
      action: "PAYMENT_WEBHOOK_RECEIVED",
      targetType: order ? "Order" : "Payment",
      targetId: order?.id ?? charge.id,
      metadata: {
        chargeId: charge.id,
        status: charge.status,
        amount: charge.amount,
        currency: charge.currency,
      },
    });

    if (!order) {
      this.logger.warn(`Tap webhook for unknown charge ${charge.id} (${charge.status})`);
      return;
    }

    if (charge.status === "CAPTURED") {
      if (order.status === OrderStatus.PENDING) {
        await this.prisma.db.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PAID },
        });
        await this.audit.log({
          actorType: ActorType.SYSTEM,
          actorId: "tap-webhook",
          action: "ORDER_PAYMENT_CONFIRMED",
          targetType: "Order",
          targetId: order.id,
          metadata: { chargeId: charge.id },
        });
      }
      return;
    }

    if (TAP_FAILURE_STATUSES.has(charge.status)) {
      if (order.status === OrderStatus.PENDING) {
        await this.prisma.db.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CANCELLED },
        });
        await this.audit.log({
          actorType: ActorType.SYSTEM,
          actorId: "tap-webhook",
          action: "ORDER_PAYMENT_FAILED",
          targetType: "Order",
          targetId: order.id,
          metadata: { chargeId: charge.id, status: charge.status },
        });
      } else if (order.status !== OrderStatus.CANCELLED) {
        // The order was already fulfilled but the charge failed upstream —
        // flag for manual reconciliation instead of destructive automation.
        await this.audit.log({
          actorType: ActorType.SYSTEM,
          actorId: "tap-webhook",
          action: "PAYMENT_WEBHOOK_MISMATCH",
          targetType: "Order",
          targetId: order.id,
          metadata: {
            chargeId: charge.id,
            chargeStatus: charge.status,
            orderStatus: order.status,
          },
        });
        this.logger.error(
          `Payment mismatch: order ${order.id} is ${order.status} but Tap charge ${charge.id} is ${charge.status}`,
        );
      }
    }
  }
}
