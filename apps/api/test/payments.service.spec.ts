import { createHmac } from "node:crypto";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { AuditService } from "../src/audit/audit.service";
import { OrdersService } from "../src/orders/orders.service";
import {
  PaymentsService,
  TapCharge,
  isTapChargeEvent,
} from "../src/payments/payments.service";
import { RedisService } from "../src/redis/redis.service";

const SECRET = "sk_test_unit_secret";

/**
 * Independent reimplementation of Tap's documented hashstring recipe
 * (https://developers.tap.company/docs/webhook) so the test pins the exact
 * wire format rather than whatever the service happens to produce.
 */
function tapHashstring(
  charge: Pick<TapCharge, "id" | "currency" | "status"> & {
    amount: string;
    gateway?: string;
    payment?: string;
    created?: string;
  },
  secret = SECRET,
): string {
  const toHash =
    `x_id${charge.id}` +
    `x_amount${charge.amount}` +
    `x_currency${charge.currency}` +
    `x_gateway_reference${charge.gateway ?? ""}` +
    `x_payment_reference${charge.payment ?? ""}` +
    `x_status${charge.status}` +
    `x_created${charge.created ?? ""}`;
  return createHmac("sha256", secret).update(toHash).digest("hex");
}

function makeCharge(overrides: Partial<TapCharge> = {}): TapCharge {
  return {
    id: "chg_TS05A4120230736x9K22710693",
    status: "CAPTURED",
    amount: 1,
    currency: "SAR",
    reference: { gateway: "mada_pg709", payment: "4327230736106619650" },
    transaction: { created: "1698392202943" },
    ...overrides,
  };
}

describe("PaymentsService", () => {
  let service: PaymentsService;

  const DEFAULT_CONFIG: Record<string, string | undefined> = {
    PAYMENT_PROVIDER_KEY: SECRET,
    WEB_ORIGIN: "http://localhost:3000",
  };
  let configValues: Record<string, string | undefined> = { ...DEFAULT_CONFIG };

  const configMock = {
    get: jest.fn((key: string) => configValues[key]),
  };
  const auditMock = { log: jest.fn().mockResolvedValue(undefined) };
  const ordersMock = {
    findOrderForCharge: jest.fn(),
    confirmOrderPayment: jest.fn(),
    failOrderPayment: jest.fn(),
    findStalePendingOrders: jest.fn().mockResolvedValue([]),
    recordUnmatchedCapture: jest.fn().mockResolvedValue(undefined),
  };
  const redisMock = {
    exists: jest.fn().mockResolvedValue(false),
    setWithExpiry: jest.fn().mockResolvedValue(undefined),
    setIfAbsent: jest.fn().mockResolvedValue(true),
  };

  /** An order that the default `makeCharge()` settles exactly. */
  function makeOrder(overrides: Record<string, unknown> = {}) {
    return {
      id: "order-1",
      status: "PENDING",
      totalAmount: 1,
      currency: "SAR",
      ...overrides,
    };
  }

  /**
   * Rebuilt per test so config-dependent constructor behaviour (provider
   * selection, webhook secret resolution) can be exercised directly.
   */
  async function createService(): Promise<PaymentsService> {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: ConfigService, useValue: configMock },
        { provide: AuditService, useValue: auditMock },
        { provide: OrdersService, useValue: ordersMock },
        { provide: RedisService, useValue: redisMock },
      ],
    }).compile();
    return module.get(PaymentsService);
  }

  beforeEach(async () => {
    configValues = { ...DEFAULT_CONFIG };
    service = await createService();
    jest.clearAllMocks();
    redisMock.exists.mockResolvedValue(false);
    redisMock.setIfAbsent.mockResolvedValue(true);
    ordersMock.findStalePendingOrders.mockResolvedValue([]);
  });

  describe("verifyWebhookSignature", () => {
    it("accepts a correctly signed charge", () => {
      const charge = makeCharge();
      const hash = tapHashstring({
        id: charge.id,
        amount: "1.00",
        currency: "SAR",
        status: "CAPTURED",
        gateway: charge.reference!.gateway,
        payment: charge.reference!.payment,
        created: charge.transaction!.created,
      });

      expect(service.verifyWebhookSignature(charge, hash)).toBe(true);
    });

    it("rejects a charge whose amount was tampered with after signing", () => {
      const charge = makeCharge();
      const hash = tapHashstring({
        id: charge.id,
        amount: "1.00",
        currency: "SAR",
        status: "CAPTURED",
        gateway: charge.reference!.gateway,
        payment: charge.reference!.payment,
        created: charge.transaction!.created,
      });

      const tampered = makeCharge({ amount: 9999 });
      expect(service.verifyWebhookSignature(tampered, hash)).toBe(false);
    });

    it("rejects a signature produced with a different secret", () => {
      const charge = makeCharge();
      const hash = tapHashstring(
        {
          id: charge.id,
          amount: "1.00",
          currency: "SAR",
          status: "CAPTURED",
          gateway: charge.reference!.gateway,
          payment: charge.reference!.payment,
          created: charge.transaction!.created,
        },
        "sk_test_attacker",
      );

      expect(service.verifyWebhookSignature(charge, hash)).toBe(false);
    });

    it("formats three-decimal currencies per ISO 4217", () => {
      const charge = makeCharge({ currency: "KWD", amount: 3 });
      const hash = tapHashstring({
        id: charge.id,
        amount: "3.000",
        currency: "KWD",
        status: "CAPTURED",
        gateway: charge.reference!.gateway,
        payment: charge.reference!.payment,
        created: charge.transaction!.created,
      });

      expect(service.verifyWebhookSignature(charge, hash)).toBe(true);
    });

    it("rejects a malformed hashstring instead of throwing", () => {
      expect(service.verifyWebhookSignature(makeCharge(), "not-a-hash")).toBe(false);
    });

    // Tap issues no dedicated webhook secret; the `hashstring` is keyed with the
    // same sk_ key used for Bearer auth. Requiring a separate value in
    // production would guarantee every real delivery failed verification.
    it("uses the Tap API key when no override secret is configured", async () => {
      configValues = { ...DEFAULT_CONFIG, NODE_ENV: "production" };
      const production = await createService();
      const charge = makeCharge();

      const hash = tapHashstring({
        id: charge.id,
        amount: "1.00",
        currency: "SAR",
        status: "CAPTURED",
        gateway: charge.reference!.gateway,
        payment: charge.reference!.payment,
        created: charge.transaction!.created,
      });

      expect(production.verifyWebhookSignature(charge, hash)).toBe(true);
    });

    it("prefers PAYMENT_PROVIDER_SECRET when Tap issued a dedicated signing key", async () => {
      configValues = { ...DEFAULT_CONFIG, PAYMENT_PROVIDER_SECRET: "dedicated_secret" };
      const overridden = await createService();
      const charge = makeCharge();

      const signedWithOverride = tapHashstring(
        {
          id: charge.id,
          amount: "1.00",
          currency: "SAR",
          status: "CAPTURED",
          gateway: charge.reference!.gateway,
          payment: charge.reference!.payment,
          created: charge.transaction!.created,
        },
        "dedicated_secret",
      );

      expect(overridden.verifyWebhookSignature(charge, signedWithOverride)).toBe(true);
    });
  });

  describe("isTapChargeEvent", () => {
    it("accepts a charge object", () => {
      expect(isTapChargeEvent(makeCharge({ object: "charge" }))).toBe(true);
    });

    it("accepts a payload with no object discriminator", () => {
      expect(isTapChargeEvent(makeCharge())).toBe(true);
    });

    // A refund delivered to the same URL carries status REFUNDED, which
    // classifies as a failure and would otherwise cancel a settled order.
    it("rejects a refund object", () => {
      expect(
        isTapChargeEvent({
          id: "re_123",
          object: "refund",
          status: "REFUNDED",
          amount: 1,
          currency: "SAR",
        }),
      ).toBe(false);
    });

    it("rejects a body with no amount rather than letting it throw later", () => {
      const { amount: _amount, ...withoutAmount } = makeCharge();
      expect(isTapChargeEvent(withoutAmount)).toBe(false);
    });

    it("rejects a non-numeric amount", () => {
      expect(isTapChargeEvent({ ...makeCharge(), amount: "1.00" })).toBe(false);
    });

    it("rejects an empty id, status or currency", () => {
      expect(isTapChargeEvent({ ...makeCharge(), id: "" })).toBe(false);
      expect(isTapChargeEvent({ ...makeCharge(), status: "" })).toBe(false);
      expect(isTapChargeEvent({ ...makeCharge(), currency: "" })).toBe(false);
    });

    it("rejects non-objects", () => {
      expect(isTapChargeEvent(null)).toBe(false);
      expect(isTapChargeEvent("chg_1")).toBe(false);
    });
  });

  describe("classifyChargeStatus", () => {
    it("treats CAPTURED as captured", () => {
      expect(service.classifyChargeStatus(makeCharge({ status: "CAPTURED" }))).toBe(
        "captured",
      );
    });

    it("treats an in-flight 3DS charge as requiring action", () => {
      expect(service.classifyChargeStatus(makeCharge({ status: "INITIATED" }))).toBe(
        "requires_action",
      );
    });

    it("treats DECLINED as failed", () => {
      expect(service.classifyChargeStatus(makeCharge({ status: "DECLINED" }))).toBe(
        "failed",
      );
    });

    it("treats an unrecognised status as failed rather than releasing goods", () => {
      expect(service.classifyChargeStatus(makeCharge({ status: "WAT" }))).toBe("failed");
    });
  });

  describe("handleChargeEvent", () => {
    it("confirms the order through the shared idempotent path", async () => {
      ordersMock.findOrderForCharge.mockResolvedValue(makeOrder());

      await service.handleChargeEvent(makeCharge({ status: "CAPTURED" }));

      expect(ordersMock.confirmOrderPayment).toHaveBeenCalledWith("order-1", {
        paymentReference: "chg_TS05A4120230736x9K22710693",
      });
    });

    /**
     * The money landed but the pieces are already released. This branch did not
     * exist: the event was dropped without an audit row, so the customer stayed
     * charged for an order that had been cancelled.
     */
    it("records a refund for a capture against a cancelled order", async () => {
      const cancelled = makeOrder({
        status: "CANCELLED",
        paymentStatus: "PENDING",
      });
      ordersMock.findOrderForCharge.mockResolvedValue(cancelled);

      await service.handleChargeEvent(makeCharge({ status: "CAPTURED" }));

      expect(ordersMock.confirmOrderPayment).not.toHaveBeenCalled();
      expect(ordersMock.recordUnmatchedCapture).toHaveBeenCalledWith(
        cancelled,
        expect.objectContaining({ id: "chg_TS05A4120230736x9K22710693" }),
      );
      expect(auditMock.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "PAYMENT_CAPTURED_WITHOUT_OPEN_ORDER",
        }),
      );
    });

    it("fails the order when the charge was declined", async () => {
      ordersMock.findOrderForCharge.mockResolvedValue(makeOrder());

      await service.handleChargeEvent(makeCharge({ status: "DECLINED" }));

      expect(ordersMock.failOrderPayment).toHaveBeenCalledWith("order-1", "DECLINED");
      expect(ordersMock.confirmOrderPayment).not.toHaveBeenCalled();
    });

    it("does not touch an already-confirmed order when a late failure arrives", async () => {
      ordersMock.findOrderForCharge.mockResolvedValue(makeOrder({ status: "PAID" }));

      await service.handleChargeEvent(makeCharge({ status: "DECLINED" }));

      expect(ordersMock.failOrderPayment).not.toHaveBeenCalled();
      expect(auditMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: "PAYMENT_WEBHOOK_MISMATCH" }),
      );
    });

    it("resolves the order from charge metadata when the reference is not stored yet", async () => {
      ordersMock.findOrderForCharge.mockResolvedValue(null);

      await service.handleChargeEvent(
        makeCharge({ metadata: { orderId: "order-9" } }),
      );

      expect(ordersMock.findOrderForCharge).toHaveBeenCalledWith(
        "chg_TS05A4120230736x9K22710693",
        "order-9",
      );
    });

    // `metadata` sits outside Tap's signed field set, so a valid cheap charge
    // must never be able to settle a more expensive order it was pointed at.
    it("refuses to confirm an order the charge does not cover", async () => {
      ordersMock.findOrderForCharge.mockResolvedValue(
        makeOrder({ totalAmount: 45000 }),
      );

      await service.handleChargeEvent(
        makeCharge({ status: "CAPTURED", metadata: { orderId: "order-1" } }),
      );

      expect(ordersMock.confirmOrderPayment).not.toHaveBeenCalled();
      expect(auditMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: "PAYMENT_WEBHOOK_AMOUNT_MISMATCH" }),
      );
    });

    it("refuses to confirm an order billed in a different currency", async () => {
      ordersMock.findOrderForCharge.mockResolvedValue(
        makeOrder({ currency: "KWD" }),
      );

      await service.handleChargeEvent(makeCharge({ status: "CAPTURED" }));

      expect(ordersMock.confirmOrderPayment).not.toHaveBeenCalled();
      expect(auditMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: "PAYMENT_WEBHOOK_AMOUNT_MISMATCH" }),
      );
    });

    it("confirms when a decimal order total matches the charge exactly", async () => {
      ordersMock.findOrderForCharge.mockResolvedValue(
        makeOrder({ totalAmount: "1.00" }),
      );

      await service.handleChargeEvent(makeCharge({ status: "CAPTURED" }));

      expect(ordersMock.confirmOrderPayment).toHaveBeenCalled();
    });

    it("ignores a replayed delivery for a charge already acted on", async () => {
      // The claim fails when the key is already present from the first delivery.
      redisMock.setIfAbsent.mockResolvedValue(false);
      ordersMock.findOrderForCharge.mockResolvedValue(makeOrder());

      await service.handleChargeEvent(makeCharge({ status: "CAPTURED" }));

      expect(ordersMock.findOrderForCharge).not.toHaveBeenCalled();
      expect(ordersMock.confirmOrderPayment).not.toHaveBeenCalled();
    });

    it("records the delivery so the next identical one is dropped", async () => {
      ordersMock.findOrderForCharge.mockResolvedValue(makeOrder());

      await service.handleChargeEvent(makeCharge({ status: "CAPTURED" }));

      expect(redisMock.setWithExpiry).toHaveBeenCalledWith(
        "payments:webhook:chg_TS05A4120230736x9K22710693:CAPTURED",
        "1",
        expect.any(Number),
      );
    });

    it("leaves an unresolvable charge retryable", async () => {
      ordersMock.findOrderForCharge.mockResolvedValue(null);

      await service.handleChargeEvent(makeCharge({ status: "CAPTURED" }));

      expect(redisMock.setWithExpiry).not.toHaveBeenCalled();
    });
  });

  describe("charge request body", () => {
    let fetchMock: jest.Mock;

    beforeEach(() => {
      fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: "chg_1", status: "CAPTURED" }),
      });
      global.fetch = fetchMock as unknown as typeof fetch;
    });

    async function charge(): Promise<{
      body: Record<string, unknown> & {
        reference: Record<string, string>;
        transaction: { expiry: unknown };
        source: unknown;
      };
      headers: Record<string, string>;
    }> {
      await service.charge({
        token: "tok_123",
        amount: 45000.567,
        currency: "sar",
        paymentMethod: "CARD",
        idempotencyKey: "checkout_client-1_123_abc",
        customer: { name: "Amira Al Faisal", email: "amira@example.com" },
        metadata: { clientId: "client-1", orderId: "order-1" },
      });

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      return {
        body: JSON.parse(init.body as string),
        headers: init.headers as Record<string, string>,
      };
    }

    // Tap reads idempotency from `reference.idempotent`; the Stripe-style header
    // is silently ignored, which would let the retry loop double-charge.
    it("sends the idempotency key in reference.idempotent, not a header", async () => {
      const { body, headers } = await charge();

      expect(body.reference.idempotent).toBe("checkout_client-1_123_abc");
      expect(headers["Idempotency-Key"]).toBeUndefined();
    });

    it("stamps the order id onto reference for dashboard reconciliation", async () => {
      const { body } = await charge();

      expect(body.reference.order).toBe("order-1");
      expect(body.reference.transaction).toBe("order-1");
    });

    it("rounds the amount to the currency's decimal places and upcases the code", async () => {
      const { body } = await charge();

      expect(body.amount).toBe(45000.57);
      expect(body.currency).toBe("SAR");
    });

    // Must be shorter than CHECKOUT_HOLD_MINUTES so the charge dies before the
    // pieces are released, never the other way round.
    it("caps the transaction expiry below the checkout hold window", async () => {
      const { body } = await charge();

      expect(body.transaction.expiry).toEqual({ period: 30, type: "MINUTE" });
    });

    it("requests 3-D Secure and never saves the card", async () => {
      const { body } = await charge();

      expect(body.threeDSecure).toBe(true);
      expect(body.customer_initiated).toBe(true);
      expect(body.save_card).toBe(false);
      expect(body.source).toEqual({ id: "tok_123" });
    });
  });

  describe("refund", () => {
    let fetchMock: jest.Mock;

    beforeEach(() => {
      fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: "re_1", status: "REFUNDED" }),
      });
      global.fetch = fetchMock as unknown as typeof fetch;
    });

    // RefundRecoveryService retries failed refunds on a cron, so without a
    // stable idempotency key a transient error could refund twice.
    it("keys the refund to the charge so retries cannot refund twice", async () => {
      await service.refund("chg_1", 45000, "SAR");

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);

      expect(body.reference.idempotent).toBe("refund_chg_1");
      expect(body.charge_id).toBe("chg_1");
      expect(body.reason).toBe("requested_by_customer");
    });

    it("rounds the refund amount to the currency's decimal places", async () => {
      await service.refund("chg_1", 3.0004, "KWD");

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(JSON.parse(init.body as string).amount).toBe(3);
    });
  });

  /**
   * Tap gives up after two delivery attempts and a cardholder who closes the
   * browser mid-3DS never hits the return URL either, so this sweep is the only
   * thing standing between a captured charge and a cancelled order.
   */
  describe("reconcileStalePendingOrders", () => {
    const staleOrder = {
      id: "order-1",
      paymentReference: "chg_stale",
      totalAmount: 1,
      currency: "SAR",
      clientId: "client-1",
    };

    function mockRetrieve(charge: TapCharge | null) {
      global.fetch = jest.fn().mockResolvedValue(
        charge
          ? { ok: true, status: 200, json: async () => charge }
          : { ok: false, status: 404, json: async () => ({}) },
      ) as unknown as typeof fetch;
    }

    it("settles an order whose charge captured without a webhook", async () => {
      ordersMock.findStalePendingOrders.mockResolvedValue([staleOrder]);
      mockRetrieve(makeCharge({ id: "chg_stale", status: "CAPTURED" }));

      await service.reconcileStalePendingOrders();

      expect(ordersMock.confirmOrderPayment).toHaveBeenCalledWith("order-1", {
        paymentReference: "chg_stale",
      });
      expect(ordersMock.failOrderPayment).not.toHaveBeenCalled();
      expect(auditMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: "ORDER_RECOVERED_FROM_MISSED_WEBHOOK" }),
      );
    });

    it("cancels an order whose charge was declined", async () => {
      ordersMock.findStalePendingOrders.mockResolvedValue([staleOrder]);
      mockRetrieve(makeCharge({ id: "chg_stale", status: "DECLINED" }));

      await service.reconcileStalePendingOrders();

      expect(ordersMock.failOrderPayment).toHaveBeenCalledWith("order-1", "DECLINED");
      expect(ordersMock.confirmOrderPayment).not.toHaveBeenCalled();
    });

    // Tap's own 30-minute window has closed by now, so the charge can no longer
    // capture and the pieces are safe to release.
    it("cancels an order still awaiting authentication past Tap's expiry", async () => {
      ordersMock.findStalePendingOrders.mockResolvedValue([staleOrder]);
      mockRetrieve(makeCharge({ id: "chg_stale", status: "INITIATED" }));

      await service.reconcileStalePendingOrders();

      expect(ordersMock.failOrderPayment).toHaveBeenCalledWith(
        "order-1",
        "PENDING_ORDER_EXPIRED",
      );
    });

    // A Tap outage must not be read as "not paid" — holding the pieces one more
    // sweep is far cheaper than cancelling a charged order.
    it("leaves the order pending when the charge cannot be retrieved", async () => {
      ordersMock.findStalePendingOrders.mockResolvedValue([staleOrder]);
      mockRetrieve(null);

      await service.reconcileStalePendingOrders();

      expect(ordersMock.confirmOrderPayment).not.toHaveBeenCalled();
      expect(ordersMock.failOrderPayment).not.toHaveBeenCalled();
    });

    it("refuses to settle an order the charge does not cover", async () => {
      ordersMock.findStalePendingOrders.mockResolvedValue([
        { ...staleOrder, totalAmount: 45000 },
      ]);
      mockRetrieve(makeCharge({ id: "chg_stale", status: "CAPTURED" }));

      await service.reconcileStalePendingOrders();

      expect(ordersMock.confirmOrderPayment).not.toHaveBeenCalled();
      expect(ordersMock.failOrderPayment).not.toHaveBeenCalled();
      expect(auditMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: "PAYMENT_RECONCILE_AMOUNT_MISMATCH" }),
      );
    });

    it("ignores orders that never reached the gateway", async () => {
      ordersMock.findStalePendingOrders.mockResolvedValue([
        { ...staleOrder, paymentReference: null },
      ]);

      await service.reconcileStalePendingOrders();

      expect(ordersMock.confirmOrderPayment).not.toHaveBeenCalled();
      expect(ordersMock.failOrderPayment).not.toHaveBeenCalled();
    });

    it("keeps sweeping when one order throws", async () => {
      ordersMock.findStalePendingOrders.mockResolvedValue([
        { ...staleOrder, id: "order-1" },
        { ...staleOrder, id: "order-2" },
      ]);
      mockRetrieve(makeCharge({ id: "chg_stale", status: "CAPTURED" }));
      ordersMock.confirmOrderPayment
        .mockRejectedValueOnce(new Error("piece taken"))
        .mockResolvedValueOnce({});

      await service.reconcileStalePendingOrders();

      expect(ordersMock.confirmOrderPayment).toHaveBeenCalledTimes(2);
    });

    // The mock provider's retrieveCharge always reports CAPTURED, so treating it
    // as authoritative would silently settle abandoned dev checkouts.
    it("expires stale orders without consulting the mock provider", async () => {
      configValues = { PAYMENT_PROVIDER_KEY: undefined, WEB_ORIGIN: "http://localhost:3000" };
      const mockProvider = await createService();
      ordersMock.findStalePendingOrders.mockResolvedValue([
        { ...staleOrder, paymentReference: "mock_123" },
      ]);

      await mockProvider.reconcileStalePendingOrders();

      expect(ordersMock.failOrderPayment).toHaveBeenCalledWith(
        "order-1",
        "PENDING_ORDER_EXPIRED",
      );
      expect(ordersMock.confirmOrderPayment).not.toHaveBeenCalled();
    });
  });
});
