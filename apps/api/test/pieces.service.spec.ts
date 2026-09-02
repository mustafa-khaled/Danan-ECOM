import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getQueueToken } from "@nestjs/bullmq";
import { PieceStatus } from "@dadan/db";
import { PiecesService } from "../src/pieces/pieces.service";
import { AuditService } from "../src/audit/audit.service";
import { CERTIFICATE_QUEUE } from "../src/certificates/jobs/certificate-job.processor";
import { PrismaService } from "../src/prisma/prisma.service";
import { StorageService } from "../src/storage/storage.service";
import { VisibilityService } from "../src/visibility/visibility.service";
import { SerialNumberService } from "../src/pieces/serial-number.service";

describe("PiecesService", () => {
  let service: PiecesService;

  const prismaMock = {
    db: {
      piece: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    },
  };
  const auditMock = { log: jest.fn().mockResolvedValue(undefined) };
  const certificateQueueMock = { add: jest.fn().mockResolvedValue(undefined) };
  const storageMock = {
    resolvePublicUrls: jest.fn().mockResolvedValue([]),
  };
  const visibilityMock = {};
  const serialNumbersMock = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PiecesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditMock },
        { provide: StorageService, useValue: storageMock },
        { provide: VisibilityService, useValue: visibilityMock },
        { provide: SerialNumberService, useValue: serialNumbersMock },
        { provide: getQueueToken(CERTIFICATE_QUEUE), useValue: certificateQueueMock },
      ],
    }).compile();

    service = module.get(PiecesService);
    jest.clearAllMocks();
  });

  describe("updatePiece (status transitions)", () => {
    const adminId = "admin-1";
    const pieceId = "piece-1";

    function mockPiece(status: PieceStatus, currentOwnerId: string | null = null) {
      prismaMock.db.piece.findUnique.mockResolvedValue({
        id: pieceId,
        status,
        currentOwnerId,
      });
      prismaMock.db.piece.update.mockResolvedValue({
        id: pieceId,
        status,
        currentOwnerId,
      });
    }

    it("allows AVAILABLE -> RETIRED", async () => {
      mockPiece(PieceStatus.AVAILABLE);
      await service.updatePiece(adminId, pieceId, { status: PieceStatus.RETIRED });
      expect(prismaMock.db.piece.update).toHaveBeenCalled();
    });

    it("allows RETIRED -> AVAILABLE", async () => {
      mockPiece(PieceStatus.RETIRED);
      await service.updatePiece(adminId, pieceId, { status: PieceStatus.AVAILABLE });
      expect(prismaMock.db.piece.update).toHaveBeenCalled();
    });

    it("rejects AVAILABLE -> OWNED (must go through checkout)", async () => {
      mockPiece(PieceStatus.AVAILABLE);
      await expect(
        service.updatePiece(adminId, pieceId, { status: PieceStatus.OWNED }),
      ).rejects.toThrow(BadRequestException);
    });

    it("rejects OWNED -> AVAILABLE (must go through transfer)", async () => {
      mockPiece(PieceStatus.OWNED, "owner-1");
      await expect(
        service.updatePiece(adminId, pieceId, { status: PieceStatus.AVAILABLE }),
      ).rejects.toThrow(BadRequestException);
    });

    it("rejects TRANSFER_PENDING -> any (managed by transfer workflow)", async () => {
      mockPiece(PieceStatus.TRANSFER_PENDING, "owner-1");
      await expect(
        service.updatePiece(adminId, pieceId, { status: PieceStatus.AVAILABLE }),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws NotFoundException for missing piece", async () => {
      prismaMock.db.piece.findUnique.mockResolvedValue(null);
      await expect(
        service.updatePiece(adminId, pieceId, { status: PieceStatus.RETIRED }),
      ).rejects.toThrow(NotFoundException);
    });

    it("allows update without status change", async () => {
      mockPiece(PieceStatus.AVAILABLE);
      await service.updatePiece(adminId, pieceId, { notes: "Updated notes" });
      expect(prismaMock.db.piece.update).toHaveBeenCalled();
    });
  });
});
