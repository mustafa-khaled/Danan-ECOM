import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PieceStatus } from "@dadan/db";
import { PiecesService } from "../src/pieces/pieces.service";
import { AuditService } from "../src/audit/audit.service";
import { CertificateOutboxService } from "../src/certificates/certificate-outbox.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { StorageService } from "../src/storage/storage.service";
import { VisibilityService } from "../src/visibility/visibility.service";
import { SerialNumberService } from "../src/pieces/serial-number.service";
import { ImageProcessingService } from "../src/storage/image-processing.service";

describe("PiecesService", () => {
  let service: PiecesService;

  const prismaMock = {
    db: {
      piece: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      savedPiece: {
        findMany: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
    },
  };
  const auditMock = { log: jest.fn().mockResolvedValue(undefined) };
  const outboxMock = { record: jest.fn().mockResolvedValue(undefined) };
  const storageMock = {
    resolvePublicUrls: jest.fn().mockResolvedValue([]),
    resolvePublicUrlsBatch: jest.fn().mockResolvedValue(new Map()),
  };
  const visibilityMock = { canAccessPiece: jest.fn().mockReturnValue(true) };
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
        { provide: ImageProcessingService, useValue: {} },
        { provide: CertificateOutboxService, useValue: outboxMock },
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

  describe("getSavedPieces", () => {
    const clientId = "client-1";

    type SavedList = Awaited<ReturnType<PiecesService["getSavedPieces"]>>;

    function firstSaved(list: SavedList) {
      const entry = list.at(0);
      if (!entry) throw new Error("expected at least one saved piece");
      return entry;
    }

    function mockSavedRow(overrides: Record<string, unknown> = {}) {
      return {
        savedAt: new Date("2026-01-02T00:00:00.000Z"),
        piece: {
          id: "piece-1",
          serialNumber: "DADAN-2026-OA-000003",
          status: "AVAILABLE",
          slug: "original-a-000003",
          name: "Original Bag",
          nameAr: "حقيبة أصلية",
          story: "Story",
          storyAr: "قصة",
          material: "Leather",
          materialAr: "جلد",
          dimensions: "30x20x10",
          dimensionsAr: null,
          mainImageUrl: "pieces/piece-1/main.jpg",
          mainImageLqip: "data:image/jpeg;base64,lqip",
          collection: {
            id: "collection-1",
            slug: "original-accessories",
            name: "Original Accessories",
            nameAr: "إكسسوارات أصلية",
          },
        },
        ...overrides,
      };
    }

    it("returns an empty list when the client has saved nothing", async () => {
      prismaMock.db.savedPiece.findMany.mockResolvedValue([]);

      await expect(service.getSavedPieces(clientId, "en")).resolves.toEqual([]);
    });

    it("scopes the query to the client and orders newest first", async () => {
      prismaMock.db.savedPiece.findMany.mockResolvedValue([]);

      await service.getSavedPieces(clientId, "en");

      expect(prismaMock.db.savedPiece.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clientId },
          orderBy: { savedAt: "desc" },
        }),
      );
    });

    it("maps rows to a { savedAt, piece } envelope", async () => {
      prismaMock.db.savedPiece.findMany.mockResolvedValue([mockSavedRow()]);

      const result = await service.getSavedPieces(clientId, "en");

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        savedAt: new Date("2026-01-02T00:00:00.000Z"),
        piece: { id: "piece-1", serialNumber: "DADAN-2026-OA-000003" },
      });
    });

    it("localizes the piece name and collection name for the requested locale", async () => {
      prismaMock.db.savedPiece.findMany.mockResolvedValue([mockSavedRow()]);

      const en = firstSaved(await service.getSavedPieces(clientId, "en"));
      const ar = firstSaved(await service.getSavedPieces(clientId, "ar"));

      expect(en.piece.name).toBe("Original Bag");
      expect(en.piece.collection.name).toBe("Original Accessories");
      expect(ar.piece.name).toBe("حقيبة أصلية");
      expect(ar.piece.collection.name).toBe("إكسسوارات أصلية");
    });

    it("strips the raw *Ar columns from the response", async () => {
      prismaMock.db.savedPiece.findMany.mockResolvedValue([mockSavedRow()]);

      const entry = firstSaved(await service.getSavedPieces(clientId, "en"));

      expect(entry.piece).not.toHaveProperty("nameAr");
      expect(entry.piece).not.toHaveProperty("storyAr");
      expect(entry.piece).not.toHaveProperty("materialAr");
      expect(entry.piece).not.toHaveProperty("dimensionsAr");
    });

    it("resolves the main image url through the storage batch resolver", async () => {
      prismaMock.db.savedPiece.findMany.mockResolvedValue([mockSavedRow()]);
      storageMock.resolvePublicUrlsBatch.mockResolvedValue(
        new Map([["pieces/piece-1/main.jpg", "https://cdn.test/main.jpg"]]),
      );

      const entry = firstSaved(await service.getSavedPieces(clientId, "en"));

      expect(storageMock.resolvePublicUrlsBatch).toHaveBeenCalledWith([
        "pieces/piece-1/main.jpg",
      ]);
      expect(entry.piece.mainImageUrl).toBe("https://cdn.test/main.jpg");
    });

    it("returns a null image when the piece has no main image", async () => {
      prismaMock.db.savedPiece.findMany.mockResolvedValue([
        mockSavedRow({
          piece: { ...mockSavedRow().piece, mainImageUrl: null },
        }),
      ]);

      const entry = firstSaved(await service.getSavedPieces(clientId, "en"));

      expect(entry.piece.mainImageUrl).toBeNull();
      expect(storageMock.resolvePublicUrlsBatch).toHaveBeenCalledWith([]);
    });
  });

  describe("savePiece", () => {
    const clientId = "client-1";
    const classId = "class-1";
    const pieceId = "piece-1";

    beforeEach(() => {
      prismaMock.db.piece.findUnique.mockResolvedValue({
        id: pieceId,
        isActive: true,
        collection: { isVisible: true, classes: [{ classId }] },
      });
    });

    it("upserts on the composite (clientId, pieceId) key", async () => {
      await service.savePiece(clientId, classId, pieceId);

      expect(prismaMock.db.savedPiece.upsert).toHaveBeenCalledWith({
        where: { clientId_pieceId: { clientId, pieceId } },
        create: { clientId, pieceId },
        update: {},
      });
    });

    it("is idempotent — a repeated save still resolves", async () => {
      await expect(
        service.savePiece(clientId, classId, pieceId),
      ).resolves.toEqual({ success: true });
      await expect(
        service.savePiece(clientId, classId, pieceId),
      ).resolves.toEqual({ success: true });

      expect(prismaMock.db.savedPiece.upsert).toHaveBeenCalledTimes(2);
    });

    it("throws NotFoundException when the piece does not exist", async () => {
      prismaMock.db.piece.findUnique.mockResolvedValue(null);

      await expect(service.savePiece(clientId, classId, pieceId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaMock.db.savedPiece.upsert).not.toHaveBeenCalled();
    });

    it("throws NotFoundException when the class cannot see the piece", async () => {
      visibilityMock.canAccessPiece.mockReturnValue(false);

      await expect(service.savePiece(clientId, classId, pieceId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaMock.db.savedPiece.upsert).not.toHaveBeenCalled();
    });
  });

  describe("unsavePiece", () => {
    it("scopes the delete to the requesting client", async () => {
      await service.unsavePiece("client-1", "piece-1");

      expect(prismaMock.db.savedPiece.deleteMany).toHaveBeenCalledWith({
        where: { clientId: "client-1", pieceId: "piece-1" },
      });
    });

    it("resolves even when nothing was saved, keeping unsave idempotent", async () => {
      prismaMock.db.savedPiece.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.unsavePiece("client-1", "piece-1")).resolves.toEqual({
        success: true,
      });
    });
  });
});
