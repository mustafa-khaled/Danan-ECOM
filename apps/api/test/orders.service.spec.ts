import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getQueueToken } from "@nestjs/bullmq";
import { OrderStatus, PaymentStatus, PieceStatus } from "@dadan/db";
import { OrdersService } from "../src/orders/orders.service";
import { AuditService } from "../src/audit/audit.service";
import { NotificationsService } from "../src/notifications/notifications.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { StorageService } from "../src/storage/storage.service";
import { CERTIFICATE_QUEUE } from "../src/certificates/jobs/certificate-job.processor";

describe("OrdersService", () => {
  let service: OrdersService;

  const txMock = {
    order: { findUnique: jest.fn(), update: jest.fn() },
    piece: { update: jest.fn() },
    ownershipRecord: { create: jest.fn() },
    cartItem: { deleteMany: jest.fn() },
    checkoutReservation: { deleteMany: jest.fn() },
    $queryRaw: jest.fn(),
  };

  const prismaMock = {
    db: {
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      client: { findUnique: jest.fn().mockResolvedValue(null) },
      checkoutReservation: { deleteMany: jest.fn() },
      $transaction: jest.fn(
        (callback: (tx: typeof txMock) => unknown) => callback(txMock),
      ),
    },
  };
  const auditMock = { log: jest.fn().mockResolvedValue(undefined) };
  const notificationsMock = {};
  const storageMock = {
    resolvePublicUrls: jest.fn().mockResolvedValue([]),
  };
  const queueMock = { add: jest.fn().mockResolvedValue({}) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditMock },
        { provide: NotificationsService, useValue: notificationsMock },
        { provide: StorageService, useValue: storageMock },
        { provide: getQueueToken(CERTIFICATE_QUEUE), useValue: queueMock },
      ],
    }).compile();

    service = module.get(OrdersService);
    jest.clearAllMocks();
  });

  describe("updateOrderStatus (FSM)", () => {
    const adminId = "admin-1";
    const orderId = "order-1";

    function mockOrder(status: OrderStatus) {
      prismaMock.db.order.findUnique.mockResolvedValue({ id: orderId, status });
      prismaMock.db.order.update.mockResolvedValue({ id: orderId, status });
    }

    it("allows PENDING -> PAID", async () => {
      mockOrder(OrderStatus.PENDING);
      await service.updateOrderStatus(adminId, orderId, OrderStatus.PAID);
      expect(prismaMock.db.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
      });
    });

    it("allows PENDING -> CANCELLED", async () => {
      mockOrder(OrderStatus.PENDING);
      await service.updateOrderStatus(adminId, orderId, OrderStatus.CANCELLED);
      expect(prismaMock.db.order.update).toHaveBeenCalled();
    });

    it("allows PAID -> PROCESSING", async () => {
      mockOrder(OrderStatus.PAID);
      await service.updateOrderStatus(adminId, orderId, OrderStatus.PROCESSING);
      expect(prismaMock.db.order.update).toHaveBeenCalled();
    });

    it("allows PROCESSING -> FULFILLED", async () => {
      mockOrder(OrderStatus.PROCESSING);
      await service.updateOrderStatus(adminId, orderId, OrderStatus.FULFILLED);
      expect(prismaMock.db.order.update).toHaveBeenCalled();
    });

    it("rejects FULFILLED -> PENDING", async () => {
      mockOrder(OrderStatus.FULFILLED);
      await expect(
        service.updateOrderStatus(adminId, orderId, OrderStatus.PENDING),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.db.order.update).not.toHaveBeenCalled();
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

    it("throws NotFoundException for missing order", async () => {
      prismaMock.db.order.findUnique.mockResolvedValue(null);
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
      expect(txMock.cartItem.deleteMany).toHaveBeenCalledWith({ where: { clientId } });
      expect(queueMock.add).toHaveBeenCalledTimes(1);
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
      expect(queueMock.add).not.toHaveBeenCalled();
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

      expect(queueMock.add).toHaveBeenCalledTimes(1);
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
  });

  describe("failOrderPayment", () => {
    const orderId = "order-1";

    it("cancels a pending order and releases its reservations", async () => {
      prismaMock.db.order.findUnique.mockResolvedValue({
        id: orderId,
        clientId: "client-1",
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
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
      expect(prismaMock.db.checkoutReservation.deleteMany).toHaveBeenCalled();
    });

    it("never unwinds an order whose payment was already captured", async () => {
      prismaMock.db.order.findUnique.mockResolvedValue({
        id: orderId,
        clientId: "client-1",
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.PAID,
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
      });

      await service.failOrderPayment(orderId, "DECLINED");

      expect(prismaMock.db.order.update).not.toHaveBeenCalled();
    });
  });
});
