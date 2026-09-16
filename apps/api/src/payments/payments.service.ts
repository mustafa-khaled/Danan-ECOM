import { createHmac, timingSafeEqual } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ActorType, OrderStatus, PaymentStatus, Prisma } from "@dadan/db";
import { AuditService } from "../audit/audit.service";
import { OrdersService } from "../orders/orders.service";
import { RedisService } from "../redis/redis.service";
import { webhookReplayKey } from "../common/constants";
import { withCronLease } from "../common/cron/cron-lease";

export interface PaymentResult {
  success: boolean;
  providerReference?: string;
  failureCode?: string;
  failureMessage?: string;
}

/**
 * `requires_action` means Tap accepted the charge but the cardholder must
 * complete 3-D Secure (or a mada/KNET redirect) at `redirectUrl` before the
 * money moves. The charge is not yet captured and must be re-checked
 * afterwards via `retrieveCharge`.
 */
export type ChargeStatus = "captured" | "requires_action" | "failed";

export interface ChargeResult {
  status: ChargeStatus;
  providerReference?: string;
  redirectUrl?: string;
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
  /** Tap's discriminator. `"charge"` here; refunds and invoices reuse the webhook. */
  object?: string;
  status: string;
  amount: number;
  currency: string;
  response?: { code?: string; message?: string };
  transaction?: { url?: string; created?: string };
  reference?: { gateway?: string; payment?: string };
  metadata?: Record<string, string>;
}

/**
 * Webhook bodies arrive unvalidated: the global `ValidationPipe` skips them
 * because `TapCharge` is an interface, and a DTO class would be worse — with
 * `forbidNonWhitelisted` it would strip the nested `reference` / `transaction`
 * fields the signature is computed over.
 *
 * Rejecting here rather than in `verifyWebhookSignature` keeps a malformed post
 * a 401 instead of a 500, and stops non-charge objects (a refund delivered to
 * the same URL carries `status: "REFUNDED"`, which classifies as a failure)
 * from ever reaching the order state machine.
 */
export function isTapChargeEvent(body: unknown): body is TapCharge {
  if (typeof body !== "object" || body === null) return false;
  const charge = body as Partial<TapCharge>;
  return (
    // Absent on older Tap payloads, so only a *wrong* value is disqualifying.
    (charge.object === undefined || charge.object === "charge") &&
    typeof charge.id === "string" &&
    charge.id.length > 0 &&
    typeof charge.status === "string" &&
    charge.status.length > 0 &&
    typeof charge.currency === "string" &&
    charge.currency.length > 0 &&
    typeof charge.amount === "number" &&
    Number.isFinite(charge.amount)
  );
}

type PaymentProvider = "mock" | "tap";

const TAP_API_BASE = "https://api.tap.company/v2";
const TAP_TIMEOUT_MS = 30_000;

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

/**
 * Non-terminal states. Tap returns these together with `transaction.url` when
 * the cardholder still has to authenticate (3DS) or complete a redirect flow.
 */
const TAP_PENDING_STATUSES = new Set(["INITIATED", "IN_PROGRESS", "PENDING"]);

/** ISO 4217 minor-unit digits; Tap formats webhook amounts with these. */
const THREE_DECIMAL_CURRENCIES = new Set(["KWD", "BHD", "OMR"]);

function currencyDecimals(currency: string): number {
  return THREE_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 3 : 2;
}

/**
 * Long enough to outlast Tap's retry schedule, so a replayed delivery is still
 * recognised after the last legitimate retry would have arrived.
 */
const WEBHOOK_REPLAY_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * How long a claimed-but-unfinished delivery blocks a retry. Short, because it
 * is only a backstop for a process that died mid-handler — the handler releases
 * its own claim on error.
 */
const WEBHOOK_IN_FLIGHT_SECONDS = 120;

/**
 * Held for less than the 5-minute cron interval so a crashed sweep resumes on
 * the next tick, but long enough to cover a full batch of 30s Tap lookups.
 */
const RECONCILE_LEASE_SECONDS = 4 * 60;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly provider: PaymentProvider;
  private readonly secretKey: string | undefined;
  private readonly webhookSecret: string | undefined;
  private readonly webhookUrl: string | undefined;
  private readonly redirectUrl: string;
  /** Guards the reconciliation sweep against overlapping with itself. */
  private reconciling = false;

  constructor(
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly orders: OrdersService,
    private readonly redis: RedisService,
  ) {
    const providerKey = config.get<string>("PAYMENT_PROVIDER_KEY");

    if (providerKey?.startsWith("sk_")) {
      this.provider = "tap";
      this.secretKey = providerKey;
      this.logger.log("Payment provider: Tap Payments");
    } else {
      if (
        config.get<string>("NODE_ENV") === "production" &&
        config.get<string>("ALLOW_MOCK_PAYMENTS") !== "true"
      ) {
        throw new Error(
          "Mock payment provider is not allowed in production. " +
            "Set PAYMENT_PROVIDER_KEY to a valid Tap key or set ALLOW_MOCK_PAYMENTS=true.",
        );
      }
      this.provider = "mock";
      this.secretKey = undefined;
      this.logger.warn("Payment provider: Mock (no real payments will be processed)");
    }

    // Tap issues no dedicated webhook secret: the `hashstring` header is an
    // HMAC keyed with the same secret API key used for Bearer auth, so that key
    // is the correct default here. PAYMENT_PROVIDER_SECRET stays supported only
    // for merchants Tap has given a separate signing key.
    // https://developers.tap.company/docs/webhook
    const webhookSecret = config.get<string>("PAYMENT_PROVIDER_SECRET");
    this.webhookSecret = webhookSecret || this.secretKey;
    if (this.provider === "tap" && webhookSecret) {
      this.logger.log(
        "Verifying payment webhooks with PAYMENT_PROVIDER_SECRET instead of the Tap API key",
      );
    }
    this.webhookUrl = config.get<string>("PAYMENT_WEBHOOK_URL") || undefined;

    // Tap rejects 3DS charges without a redirect target, so this always needs a
    // value even in dev — the browser performs the redirect, not Tap, so
    // localhost is fine here (unlike the webhook URL).
    const webOrigin = config.get<string>("WEB_ORIGIN") || "http://localhost:3000";
    this.redirectUrl =
      config.get<string>("PAYMENT_REDIRECT_URL") ||
      `${webOrigin.replace(/\/$/, "")}/beta/checkout/return`;
  }

  get providerName(): PaymentProvider {
    return this.provider;
  }

  async charge(params: ChargeParams): Promise<ChargeResult> {
    if (this.provider === "tap") {
      return this.chargeTap(params);
    }
    return this.chargeMock(params);
  }

  private async chargeTap(params: ChargeParams): Promise<ChargeResult> {
    const [firstName, ...rest] = params.customer.name.trim().split(/\s+/);
    const currency = params.currency.toUpperCase();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.secretKey}`,
      "Content-Type": "application/json",
    };

    const body = JSON.stringify({
      // Tap rejects amounts carrying more precision than the currency allows.
      amount: Number(params.amount.toFixed(currencyDecimals(currency))),
      currency,
      // Tap enforces 3DS for customer-initiated card transactions regardless of
      // this flag, and mada/KNET always redirect. Requesting it explicitly keeps
      // our behaviour aligned with what the gateway will actually do.
      threeDSecure: true,
      customer_initiated: true,
      save_card: false,
      description: "DADAN Dijital purchase",
      statement_descriptor: "DADAN",
      // Stated explicitly so the relationship with CHECKOUT_HOLD_MINUTES (35) is
      // visible: the charge must expire before we release the pieces, never after.
      transaction: { expiry: { period: 30, type: "MINUTE" } },
      // Tap reads idempotency from `reference.idempotent`, not from a header, and
      // honours it for 24h. Without it the retry loop below could turn an
      // aborted-but-successful request into a second charge.
      // https://developers.tap.company/docs/idempotency
      reference: {
        ...(params.idempotencyKey ? { idempotent: params.idempotencyKey } : {}),
        ...(params.metadata.orderId
          ? { order: params.metadata.orderId, transaction: params.metadata.orderId }
          : {}),
      },
      metadata: { ...params.metadata, paymentMethod: params.paymentMethod },
      customer: {
        first_name: firstName ?? "DADAN",
        last_name: rest.join(" ") || undefined,
        email: params.customer.email,
      },
      source: { id: params.token },
      redirect: { url: this.redirectUrl },
      ...(this.webhookUrl ? { post: { url: this.webhookUrl } } : {}),
    });

    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TAP_TIMEOUT_MS);
      try {
        const response = await fetch(`${TAP_API_BASE}/charges`, {
          method: "POST",
          headers,
          body,
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (response.status >= 500 && attempt < maxAttempts) {
          this.logger.warn(`Tap charge attempt ${attempt} returned ${response.status}, retrying...`);
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          continue;
        }

        const charge = (await response.json()) as TapCharge & {
          errors?: { code?: string; description?: string }[];
        };

        if (!response.ok) {
          const error = charge.errors?.[0];
          this.logger.error(
            `Tap charge failed (HTTP ${response.status}): ${error?.description ?? "unknown"}`,
          );
          return {
            status: "failed",
            failureCode: error?.code ?? `HTTP_${response.status}`,
            failureMessage: error?.description,
          };
        }

        if (charge.status === "CAPTURED") {
          return { status: "captured", providerReference: charge.id };
        }

        // A pending status plus a transaction URL is the 3DS/redirect flow, not
        // a decline — the cardholder has to authenticate before Tap captures.
        if (TAP_PENDING_STATUSES.has(charge.status) && charge.transaction?.url) {
          this.logger.log(
            `Tap charge ${charge.id} requires cardholder action (${charge.status})`,
          );
          return {
            status: "requires_action",
            providerReference: charge.id,
            redirectUrl: charge.transaction.url,
          };
        }

        this.logger.warn(`Tap charge ${charge.id} not captured: ${charge.status}`);
        return {
          status: "failed",
          providerReference: charge.id,
          failureCode: charge.status,
          failureMessage: charge.response?.message,
        };
      } catch (error) {
        clearTimeout(timer);
        const isTransient =
          error instanceof Error &&
          (error.name === "AbortError" || error.message.includes("fetch"));
        if (isTransient && attempt < maxAttempts) {
          this.logger.warn(`Tap charge attempt ${attempt} failed (${error instanceof Error ? error.message : String(error)}), retrying...`);
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          continue;
        }
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Tap charge request failed: ${message}`);
        return {
          status: "failed",
          failureCode: "TAP_REQUEST_FAILED",
        };
      }
    }

    return { status: "failed", failureCode: "TAP_REQUEST_FAILED" };
  }

  private chargeMock(params: ChargeParams): ChargeResult {
    if (params.token === "fail" || params.token.startsWith("fail_")) {
      return {
        status: "failed",
        failureCode: "PAYMENT_DECLINED",
        failureMessage: "Payment was declined",
      };
    }

    const ref = `mock_${Date.now()}_${params.metadata.clientId ?? "checkout"}`;

    // Lets tests and local dev exercise the redirect/3DS branch without Tap.
    if (params.token === "3ds" || params.token.startsWith("3ds_")) {
      return {
        status: "requires_action",
        providerReference: ref,
        redirectUrl: `${this.redirectUrl}?tap_id=${ref}`,
      };
    }

    this.logger.log(
      `Mock charge: ${params.amount} ${params.currency} via ${params.paymentMethod}, ` +
        `token=${params.token.slice(0, 8)}..., ref=${ref}`,
    );

    return { status: "captured", providerReference: ref };
  }

  /**
   * Fetches the authoritative state of a charge. This is how we confirm a
   * payment after the cardholder returns from 3DS: the `tap_id` in the return
   * URL is attacker-controllable, so the status must come from Tap directly.
   */
  async retrieveCharge(chargeId: string): Promise<TapCharge | null> {
    if (this.provider !== "tap") {
      return this.retrieveChargeMock(chargeId);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TAP_TIMEOUT_MS);
    try {
      const response = await fetch(
        `${TAP_API_BASE}/charges/${encodeURIComponent(chargeId)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${this.secretKey}` },
          signal: controller.signal,
        },
      );
      clearTimeout(timer);

      if (!response.ok) {
        this.logger.error(
          `Tap retrieve charge ${chargeId} failed (HTTP ${response.status})`,
        );
        return null;
      }

      const charge = (await response.json()) as TapCharge;
      return charge?.id ? charge : null;
    } catch (error) {
      clearTimeout(timer);
      this.logger.error(
        `Tap retrieve charge ${chargeId} threw: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Maps a Tap charge onto our three-state model. Unknown statuses are treated
   * as failures so an unrecognised state can never silently release goods.
   */
  classifyChargeStatus(charge: TapCharge): ChargeStatus {
    if (charge.status === "CAPTURED") return "captured";
    if (TAP_FAILURE_STATUSES.has(charge.status)) return "failed";
    if (TAP_PENDING_STATUSES.has(charge.status)) return "requires_action";
    return "failed";
  }

  private retrieveChargeMock(chargeId: string): TapCharge | null {
    if (!chargeId.startsWith("mock_")) return null;
    return {
      id: chargeId,
      status: "CAPTURED",
      amount: 0,
      currency: "SAR",
    };
  }

  async refund(
    providerReference: string,
    amount: number,
    currency: string,
  ): Promise<PaymentResult> {
    if (this.provider === "tap") {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TAP_TIMEOUT_MS);
      try {
        const response = await fetch(`${TAP_API_BASE}/refunds`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            charge_id: providerReference,
            // Tap rejects more precision than the currency allows.
            amount: Number(amount.toFixed(currencyDecimals(currency))),
            currency: currency.toUpperCase(),
            reason: "requested_by_customer",
            // Keyed to the charge so `RefundRecoveryService`'s retries — and the
            // compensating refund in `CartService` — cannot refund twice.
            reference: { idempotent: `refund_${providerReference}` },
          }),
          signal: controller.signal,
        });
        clearTimeout(timer);

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
        clearTimeout(timer);
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
   * True when the charge settles exactly the order's total. Tap's signature
   * covers the amount, so this is what ties a signed charge to the order it is
   * allowed to settle — without it, a charge for one order could confirm
   * another, more expensive one.
   */
  private chargeSettlesOrder(
    charge: TapCharge,
    order: { totalAmount: Prisma.Decimal | number | string; currency: string },
  ): boolean {
    if (charge.currency?.toUpperCase() !== order.currency?.toUpperCase()) {
      return false;
    }
    const chargeAmount = Number(charge.amount);
    const orderAmount = Number(order.totalAmount);
    if (!Number.isFinite(chargeAmount) || !Number.isFinite(orderAmount)) {
      return false;
    }
    const decimals = currencyDecimals(charge.currency);
    return chargeAmount.toFixed(decimals) === orderAmount.toFixed(decimals);
  }

  /**
   * Reconciles an order against an asynchronous Tap charge event.
   * Idempotent: repeated webhooks for the same terminal state are no-ops.
   */
  async handleChargeEvent(charge: TapCharge): Promise<void> {
    // Tap has no nonce and retries deliveries, so a captured (charge, status)
    // pair stays replayable forever once observed. The claim is atomic because a
    // check-then-set let two concurrent deliveries of the same charge both pass
    // the check and both act on it.
    const replayKey = webhookReplayKey(charge.id, charge.status);
    const claimed = await this.redis.setIfAbsent(
      replayKey,
      "1",
      WEBHOOK_IN_FLIGHT_SECONDS,
    );
    if (!claimed) {
      this.logger.warn(
        `Ignoring replayed Tap webhook for charge ${charge.id} (${charge.status})`,
      );
      return;
    }

    try {
      await this.processChargeEvent(charge, replayKey);
    } catch (error) {
      // Release the claim so Tap's next retry is processed rather than ignored.
      await this.redis.del(replayKey);
      throw error;
    }
  }

  private async processChargeEvent(
    charge: TapCharge,
    replayKey: string,
  ): Promise<void> {
    const order = await this.orders.findOrderForCharge(
      charge.id,
      charge.metadata?.orderId,
    );

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

    const status = this.classifyChargeStatus(charge);

    if (status === "captured") {
      if (!this.chargeSettlesOrder(charge, order)) {
        await this.audit.log({
          actorType: ActorType.SYSTEM,
          actorId: "tap-webhook",
          action: "PAYMENT_WEBHOOK_AMOUNT_MISMATCH",
          targetType: "Order",
          targetId: order.id,
          metadata: {
            chargeId: charge.id,
            chargeAmount: charge.amount,
            chargeCurrency: charge.currency,
            orderAmount: String(order.totalAmount),
            orderCurrency: order.currency,
          },
        });
        this.logger.error(
          `Refusing to confirm order ${order.id}: charge ${charge.id} settles ` +
            `${charge.amount} ${charge.currency} but the order totals ` +
            `${String(order.totalAmount)} ${order.currency}`,
        );
        return;
      }

      if (order.status === OrderStatus.PENDING) {
        // Shares the idempotent confirmation path with the 3DS return call, so
        // whichever arrives first wins and the other becomes a no-op.
        await this.orders.confirmOrderPayment(order.id, {
          paymentReference: charge.id,
        });
        await this.audit.log({
          actorType: ActorType.SYSTEM,
          actorId: "tap-webhook",
          action: "ORDER_PAYMENT_CONFIRMED",
          targetType: "Order",
          targetId: order.id,
          metadata: { chargeId: charge.id },
        });
      } else if (
        order.paymentStatus === PaymentStatus.PAID &&
        order.paymentReference === charge.id
      ) {
        // A duplicate delivery for the charge that already settled this order.
        this.logger.log(
          `Charge ${charge.id} already settled order ${order.id}; nothing to do`,
        );
      } else {
        // Money captured with nowhere to land — the order was cancelled or
        // failed before this delivery arrived. Queue the refund we owe rather
        // than dropping the event, which previously left the customer charged
        // for pieces that had already been released.
        await this.audit.log({
          actorType: ActorType.SYSTEM,
          actorId: "tap-webhook",
          action: "PAYMENT_CAPTURED_WITHOUT_OPEN_ORDER",
          targetType: "Order",
          targetId: order.id,
          metadata: {
            chargeId: charge.id,
            chargeAmount: charge.amount,
            chargeCurrency: charge.currency,
            orderStatus: order.status,
            orderPaymentStatus: order.paymentStatus,
          },
        });
        await this.orders.recordUnmatchedCapture(order, charge);
        this.logger.error(
          `Charge ${charge.id} captured ${charge.amount} ${charge.currency} but ` +
            `order ${order.id} is ${order.status}/${order.paymentStatus} — refund queued`,
        );
      }
      await this.markWebhookProcessed(replayKey);
      return;
    }

    if (status === "failed") {
      if (order.status === OrderStatus.PENDING) {
        await this.orders.failOrderPayment(order.id, charge.status);
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
      await this.markWebhookProcessed(replayKey);
    }
  }

  /**
   * Extends the in-flight claim to the full replay window. Only called once the
   * event has been acted on, so a delivery that threw mid-processing keeps the
   * short TTL and stays retryable.
   */
  private async markWebhookProcessed(replayKey: string): Promise<void> {
    await this.redis.setWithExpiry(replayKey, "1", WEBHOOK_REPLAY_TTL_SECONDS);
  }

  /**
   * Safety net for a webhook that never arrived. Tap only retries a delivery
   * twice before giving up, and a cardholder who closes the browser mid-3DS
   * never hits the return URL either — so without this an order could be
   * cancelled (releasing its pieces) while the customer's card was charged.
   *
   * Runs after the order's own TTL has elapsed, by which point Tap's 30-minute
   * transaction window has closed and the charge status is final.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async reconcileStalePendingOrders(): Promise<void> {
    // The in-process flag only stops this instance overlapping itself; the Redis
    // lease stops every other replica running the same sweep, which would issue
    // duplicate gateway calls for the same orders.
    if (this.reconciling) {
      this.logger.warn("Skipping reconciliation sweep: previous run still in progress");
      return;
    }
    this.reconciling = true;
    try {
      await withCronLease(
        this.redis,
        "payments:reconcile-stale-orders",
        RECONCILE_LEASE_SECONDS,
        this.logger,
        async () => {
          const stale = await this.orders.findStalePendingOrders();
          for (const order of stale) {
            if (!order.paymentReference) continue;
            try {
              await this.reconcileStaleOrder(order);
            } catch (error) {
              this.logger.error(
                `Failed to reconcile stale order ${order.id}: ${error instanceof Error ? error.message : String(error)}`,
              );
            }
          }
        },
      );
    } finally {
      this.reconciling = false;
    }
  }

  private async reconcileStaleOrder(order: {
    id: string;
    paymentReference: string | null;
    totalAmount: Prisma.Decimal | number | string;
    currency: string;
  }): Promise<void> {
    const reference = order.paymentReference!;

    // The mock provider has no authoritative remote state, so there is nothing
    // to recover — treat the order as abandoned exactly as before.
    if (this.provider !== "tap") {
      await this.orders.failOrderPayment(order.id, "PENDING_ORDER_EXPIRED");
      return;
    }

    const charge = await this.retrieveCharge(reference);
    if (!charge) {
      // Could be a transient Tap outage. Leaving the order PENDING keeps its
      // pieces held for one more sweep, which is far cheaper than cancelling an
      // order whose payment we could not rule out.
      this.logger.warn(
        `Leaving order ${order.id} pending: charge ${reference} could not be retrieved`,
      );
      return;
    }

    const status = this.classifyChargeStatus(charge);

    if (status === "captured") {
      if (!this.chargeSettlesOrder(charge, order)) {
        await this.audit.log({
          actorType: ActorType.SYSTEM,
          actorId: "reconciliation",
          action: "PAYMENT_RECONCILE_AMOUNT_MISMATCH",
          targetType: "Order",
          targetId: order.id,
          metadata: {
            chargeId: charge.id,
            chargeAmount: charge.amount,
            chargeCurrency: charge.currency,
            orderAmount: String(order.totalAmount),
            orderCurrency: order.currency,
          },
        });
        this.logger.error(
          `Refusing to settle order ${order.id}: charge ${charge.id} settles ` +
            `${charge.amount} ${charge.currency} but the order totals ` +
            `${String(order.totalAmount)} ${order.currency}`,
        );
        return;
      }

      await this.orders.confirmOrderPayment(order.id, { paymentReference: charge.id });
      await this.audit.log({
        actorType: ActorType.SYSTEM,
        actorId: "reconciliation",
        action: "ORDER_RECOVERED_FROM_MISSED_WEBHOOK",
        targetType: "Order",
        targetId: order.id,
        metadata: { chargeId: charge.id, chargeStatus: charge.status },
      });
      this.logger.warn(
        `Recovered order ${order.id} from captured charge ${charge.id} that no webhook delivered`,
      );
      return;
    }

    // Either a terminal failure, or still un-authenticated past Tap's expiry —
    // both mean the charge can no longer capture, so release the pieces.
    await this.orders.failOrderPayment(
      order.id,
      status === "failed" ? charge.status : "PENDING_ORDER_EXPIRED",
    );
  }
}
