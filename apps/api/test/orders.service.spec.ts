import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { OrderStatus, PaymentStatus, PieceStatus, Prisma } from "@dadan/db";
import { OrdersService } from "../src/orders/orders.service";
import { AuditService } from "../src/audit/audit.service";
import { NotificationsService } from "../src/notifications/notifications.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { StorageService } from "../src/storage/storage.service";
import { CertificateOutboxService } from "../src/certificates/certificate-outbox.service";

describe("OrdersService", () => {
  let service: OrdersService;

  const txMock = {
    order: { findUnique: jest.fn(), update: jest.fn() },
    piece: { update: jest.fn() },
    ownershipRecord: { create: jest.fn() },
    cartItem: { deleteMany: jest.fn() },
    checkoutReservation: { deleteMany: jest.fn() },
    savedPiece: { deleteMany: jest.fn() },
    $queryRaw: jest.fn(),
  };

  const prismaMock = {
    db: {
      order: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      client: { findUnique: jest.fn().mockResolvedValue(null) },
      checkoutReservation: { deleteMany: jest.fn() },
      // Async so the mock's return type is a promise: the retry tests need
      // `mockRejectedValueOnce`, which is typed `never` on a sync mock.
      $transaction: jest.fn(
        async (callback: (tx: typeof txMock) => unknown) => callback(txMock),
      ),
    },
  };
  const auditMock = {
    log: jest.fn().mockResolvedValue(undefined),
    logMany: jest.fn().mockResolvedValue(undefined),
  };
  const notificationsMock = {};
  const storageMock = {
    resolvePublicUrls: jest.fn().mockResolvedValue([]),
  };
  const outboxMock = { record: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditMock },
        { provide: NotificationsService, useValue: notificationsMock },
        { provide: StorageService, useValue: storageMock },
        { provide: CertificateOutboxService, useValue: outboxMock },
      ],
    }).compile();

    service = module.get(OrdersService);
    jest.clearAllMocks();
  });

  describe("updateOrderStatus (FSM)", () => {
    const adminId = "admin-1";
    const orderId = "order-1";

    function mockOrder(status: OrderStatus) {
      txMock.$queryRaw.mockResolvedValue([]);
      txMock.order.findUnique.mockResolvedValue({ id: orderId, status });
      txMock.order.update.mockResolvedValue({ id: orderId, status });
    }

    it("allows PENDING -> PAID", async () => {
      mockOrder(OrderStatus.PENDING);
      await service.updateOrderStatus(adminId, orderId, OrderStatus.PAID);
      expect(txMock.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
      });
    });

    it("allows PENDING -> CANCELLED", async () => {
      mockOrder(OrderStatus.PENDING);
      await service.updateOrderStatus(adminId, orderId, OrderStatus.CANCELLED);
      expect(txMock.order.update).toHaveBeenCalled();
    });

    it("allows PAID -> PROCESSING", async () => {
      mockOrder(OrderStatus.PAID);
      await service.updateOrderStatus(adminId, orderId, OrderStatus.PROCESSING);
      expect(txMock.order.update).toHaveBeenCalled();
    });

    it("allows PROCESSING -> FULFILLED", async () => {
      mockOrder(OrderStatus.PROCESSING);
      await service.updateOrderStatus(adminId, orderId, OrderStatus.FULFILLED);
      expect(txMock.order.update).toHaveBeenCalled();
    });

    it("rejects FULFILLED -> PENDING", async () => {
      mockOrder(OrderStatus.FULFILLED);
      await expect(
        service.updateOrderStatus(adminId, orderId, OrderStatus.PENDING),
      ).rejects.toThrow(BadRequestException);
      expect(txMock.order.update).not.toHaveBeenCalled();
    });

    it("rejects CANCELLED -> PAID", async () => {
      mockOrder(OrderStatus.CANCELLED);
      await expect(
        service.updateOrderStatus(adminId, orderId, OrderStatus.PAID),
      ).rejects.toThrow(BadRequestException);
    });

    it("rejects PAID -> PENDING (backward)", async () => {
      mockOrder(OrderStatus.PAID);
      await expect(
        service.updateOrderStatus(adminId, orderId, OrderStatus.PENDING),
      ).rejects.toThrow(BadRequestException);
    });

    it("rejects FULFILLED -> CANCELLED (terminal)", async () => {
      mockOrder(OrderStatus.FULFILLED);
      await expect(
        service.updateOrderStatus(adminId, orderId, OrderStatus.CANCELLED),
      ).rejects.toThrow(BadRequestException);
    });

    /**
     * Cancelling a settled order via a status change left the money captured,
     * the pieces owned and the certificates valid. `refundOrder` is the only
     * path that may unwind a paid order, because it compensates all three.
     */
    it("rejects PAID -> CANCELLED so it cannot bypass the refund path", async () => {
      mockOrder(OrderStatus.PAID);
      await expect(
        service.updateOrderStatus(adminId, orderId, OrderStatus.CANCELLED),
      ).rejects.toThrow(BadRequestException);
      expect(txMock.order.update).not.toHaveBeenCalled();
    });

    it("rejects PROCESSING -> CANCELLED so it cannot bypass the refund path", async () => {
      mockOrder(OrderStatus.PROCESSING);
      await expect(
        service.updateOrderStatus(adminId, orderId, OrderStatus.CANCELLED),
      ).rejects.toThrow(BadRequestException);
      expect(txMock.order.update).not.toHaveBeenCalled();
    });

    it("throws NotFoundException for missing order", async () => {
      txMock.$queryRaw.mockResolvedValue([]);
      txMock.order.findUnique.mockResolvedValue(null);
      await expect(
        service.updateOrderStatus(adminId, orderId, OrderStatus.PAID),
      ).rejects.toThrow(NotFoundException);
    });

    it("logs audit entry on successful transition", async () => {
      mockOrder(OrderStatus.PAID);
      await service.updateOrderStatus(adminId, orderId, OrderStatus.PROCESSING, "127.0.0.1");
      expect(auditMock.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "ORDER_STATUS_UPDATED",
          metadata: { from: OrderStatus.PAID, to: OrderStatus.PROCESSING },
          ipAddress: "127.0.0.1",
        }),
      );
    });
  });

  describe("confirmOrderPayment", () => {
    const orderId = "order-1";
    const clientId = "client-1";
    const pendingOrder = {
      id: orderId,
      clientId,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      items: [{ pieceId: "piece-1" }],
    };

    beforeEach(() => {
      txMock.$queryRaw.mockResolvedValue([
        {
          id: "piece-1",
          serialNumber: "SN-1",
          status: PieceStatus.AVAILABLE,
          currentOwnerId: null,
        },
      ]);
      txMock.order.update.mockResolvedValue({
        ...pendingOrder,
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.PAID,
      });
    });

    it("transfers ownership and settles the order", async () => {
      txMock.order.findUnique.mockResolvedValue(pendingOrder);

      await service.confirmOrderPayment(orderId, { paymentReference: "chg_1" });

      expect(txMock.piece.update).toHaveBeenCalledWith({
        where: { id: "piece-1" },
        data: { status: PieceStatus.OWNED, currentOwnerId: clientId },
      });
      expect(txMock.ownershipRecord.create).toHaveBeenCalledTimes(1);
      expect(outboxMock.record).toHaveBeenCalledTimes(1);
    });

    /**
     * Deleting by `clientId` alone wiped cart rows and holds belonging to a
     * second checkout the same client had in flight; the sold pieces must be
     * cleared from every cart, and nothing else touched.
     */
    it("clears only this order's pieces from carts and reservations", async () => {
      txMock.order.findUnique.mockResolvedValue(pendingOrder);

      await service.confirmOrderPayment(orderId, { paymentReference: "chg_1" });

      expect(txMock.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { pieceId: { in: ["piece-1"] } },
      });
      expect(txMock.checkoutReservation.deleteMany).toHaveBeenCalledWith({
        where: { pieceId: { in: ["piece-1"] } },
      });
    });

    // The 3DS return call and Tap's webhook race to confirm the same charge.
    it("is a no-op when the order was already paid", async () => {
      txMock.order.findUnique.mockResolvedValue({
        ...pendingOrder,
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.PAID,
      });

      await service.confirmOrderPayment(orderId, { paymentReference: "chg_1" });

      expect(txMock.piece.update).not.toHaveBeenCalled();
      expect(txMock.ownershipRecord.create).not.toHaveBeenCalled();
      expect(outboxMock.record).not.toHaveBeenCalled();
      expect(auditMock.log).not.toHaveBeenCalled();
    });

    it("does not issue certificates twice across two confirmations", async () => {
      txMock.order.findUnique
        .mockResolvedValueOnce(pendingOrder)
        .mockResolvedValueOnce({
          ...pendingOrder,
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.PAID,
        });

      await service.confirmOrderPayment(orderId, { paymentReference: "chg_1" });
      await service.confirmOrderPayment(orderId, { paymentReference: "chg_1" });

      expect(outboxMock.record).toHaveBeenCalledTimes(1);
      expect(txMock.ownershipRecord.create).toHaveBeenCalledTimes(1);
    });

    it("refuses to settle a cancelled order", async () => {
      txMock.order.findUnique.mockResolvedValue({
        ...pendingOrder,
        status: OrderStatus.CANCELLED,
      });

      await expect(service.confirmOrderPayment(orderId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("throws when the order does not exist", async () => {
      txMock.order.findUnique.mockResolvedValue(null);

      await expect(service.confirmOrderPayment(orderId)).rejects.toThrow(
        NotFoundException,
      );
    });

    /**
     * A Serializable conflict is expected under concurrent checkout and must not
     * surface to the caller: `confirmOrCompensate` refunds on a ConflictException
     * and would have refunded a good payment when the retry would have succeeded.
     */
    it("retries a serialization failure and then settles", async () => {
      txMock.order.findUnique.mockResolvedValue(pendingOrder);
      const serializationFailure = new Prisma.PrismaClientKnownRequestError(
        "could not serialize access due to read/write dependencies",
        { code: "P2034", clientVersion: "test" },
      );
      prismaMock.db.$transaction
        .mockRejectedValueOnce(serializationFailure)
        .mockImplementationOnce(
          async (callback: (tx: typeof txMock) => unknown) => callback(txMock),
        );

      const settled = await service.confirmOrderPayment(orderId, {
        paymentReference: "chg_1",
      });

      expect(prismaMock.db.$transaction).toHaveBeenCalledTimes(2);
      expect(settled.paymentStatus).toBe(PaymentStatus.PAID);
    });

    it("gives up on an error that is not retryable", async () => {
      const notFound = new Prisma.PrismaClientKnownRequestError("gone", {
        code: "P2025",
        clientVersion: "test",
      });
      prismaMock.db.$transaction.mockRejectedValueOnce(notFound);

      await expect(service.confirmOrderPayment(orderId)).rejects.toThrow(
        notFound,
      );
      expect(prismaMock.db.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe("failOrderPayment", () => {
    const orderId = "order-1";

    it("cancels a pending order and releases its reservations", async () => {
      prismaMock.db.order.findUnique.mockResolvedValue({
        id: orderId,
        clientId: "client-1",
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        items: [{ pieceId: "piece-1" }],
      });
      prismaMock.db.order.update.mockResolvedValue({ id: orderId });

      await service.failOrderPayment(orderId, "DECLINED");

      expect(prismaMock.db.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.FAILED,
        },
      });
      // Scoped to this order so a second in-flight checkout keeps its holds.
      expect(prismaMock.db.checkoutReservation.deleteMany).toHaveBeenCalledWith({
        where: { clientId: "client-1", pieceId: { in: ["piece-1"] } },
      });
    });

    it("never unwinds an order whose payment was already captured", async () => {
      prismaMock.db.order.findUnique.mockResolvedValue({
        id: orderId,
        clientId: "client-1",
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.PAID,
        items: [{ pieceId: "piece-1" }],
      });

      await expect(service.failOrderPayment(orderId, "DECLINED")).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaMock.db.order.update).not.toHaveBeenCalled();
    });

    it("is a no-op for an already-cancelled order", async () => {
      prismaMock.db.order.findUnique.mockResolvedValue({
        id: orderId,
        clientId: "client-1",
        status: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.FAILED,
        items: [{ pieceId: "piece-1" }],
      });

      await service.failOrderPayment(orderId, "DECLINED");

      expect(prismaMock.db.order.update).not.toHaveBeenCalled();
    });
  });

  describe("expireStalePendingOrders", () => {
    /**
     * An order carrying a charge reference may have captured at the gateway
     * without a webhook ever arriving, so cancelling it on age alone would
     * release the pieces of a customer who was actually charged. Those orders
     * belong to `PaymentsService.reconcileStalePendingOrders` instead.
     */
    it("leaves orders that already have a charge reference alone", async () => {
      prismaMock.db.order.findMany.mockResolvedValue([
        { id: "order-charged", paymentReference: "chg_1", clientId: "client-1" },
      ]);

      const expired = await service.expireStalePendingOrders();

      expect(expired).toBe(0);
      expect(prismaMock.db.order.update).not.toHaveBeenCalled();
    });

    it("cancels orders that never reached the gateway", async () => {
      prismaMock.db.order.findMany.mockResolvedValue([
        { id: "order-1", paymentReference: null, clientId: "client-1" },
        { id: "order-2", paymentReference: "chg_2", clientId: "client-1" },
      ]);
      prismaMock.db.order.findUnique.mockResolvedValue({
        id: "order-1",
        clientId: "client-1",
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        items: [{ pieceId: "piece-1" }],
      });
      prismaMock.db.order.update.mockResolvedValue({ id: "order-1" });

      const expired = await service.expireStalePendingOrders();

      expect(expired).toBe(1);
      expect(prismaMock.db.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.FAILED,
        },
      });
    });

    it("keeps going when one order fails to expire", async () => {
      prismaMock.db.order.findMany.mockResolvedValue([
        { id: "order-1", paymentReference: null, clientId: "client-1" },
        { id: "order-2", paymentReference: null, clientId: "client-1" },
      ]);
      prismaMock.db.order.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: "order-2",
          clientId: "client-1",
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          items: [{ pieceId: "piece-2" }],
        });
      prismaMock.db.order.update.mockResolvedValue({ id: "order-2" });

      const expired = await service.expireStalePendingOrders();

      expect(expired).toBe(1);
    });
  });
});
