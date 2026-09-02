import { createHmac } from "node:crypto";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { AuditService } from "../src/audit/audit.service";
import { OrdersService } from "../src/orders/orders.service";
import { PaymentsService, TapCharge } from "../src/payments/payments.service";
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

  const configValues: Record<string, string | undefined> = {
    PAYMENT_PROVIDER_KEY: SECRET,
    WEB_ORIGIN: "http://localhost:3000",
  };

  const configMock = {
    get: jest.fn((key: string) => configValues[key]),
  };
  const auditMock = { log: jest.fn().mockResolvedValue(undefined) };
  const ordersMock = {
    findOrderForCharge: jest.fn(),
    confirmOrderPayment: jest.fn(),
    failOrderPayment: jest.fn(),
  };
  const redisMock = {
    exists: jest.fn().mockResolvedValue(false),
    setWithExpiry: jest.fn().mockResolvedValue(undefined),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: ConfigService, useValue: configMock },
        { provide: AuditService, useValue: auditMock },
        { provide: OrdersService, useValue: ordersMock },
        { provide: RedisService, useValue: redisMock },
      ],
    }).compile();

    service = module.get(PaymentsService);
    jest.clearAllMocks();
    redisMock.exists.mockResolvedValue(false);
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
      redisMock.exists.mockResolvedValue(true);
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
});
