import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getQueueToken } from "@nestjs/bullmq";
import { OrderStatus } from "@dadan/db";
import { OrdersService } from "../src/orders/orders.service";
import { AuditService } from "../src/audit/audit.service";
import { NotificationsService } from "../src/notifications/notifications.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { StorageService } from "../src/storage/storage.service";
import { CERTIFICATE_QUEUE } from "../src/certificates/jobs/certificate-job.processor";

describe("OrdersService", () => {
  let service: OrdersService;

  const prismaMock = {
    db: {
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
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
});
