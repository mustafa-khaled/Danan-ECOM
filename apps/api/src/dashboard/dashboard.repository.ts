import { Injectable } from "@nestjs/common";
import {
  PaymentStatus,
  PieceStatus,
  Prisma,
  StaffRequestStatus,
  StaffRequestType,
  TransferStatus,
} from "@dadan/db";
import { PrismaService } from "../prisma/prisma.service";

/** Rows the analytics chart renders. */
const COLLECTION_PERFORMANCE_LIMIT = 12;

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  startOfUtcMonth(date = new Date()) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  }

  daysAgo(days: number) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - days);
    return date;
  }

  periodBounds(period: "30d" | "12m") {
    const now = new Date();
    if (period === "30d") {
      const from = this.daysAgo(30);
      const previousFrom = this.daysAgo(60);
      return { from, to: now, previousFrom, previousTo: from };
    }
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
    const previousFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 23, 1));
    return { from, to: now, previousFrom, previousTo: from };
  }

  countClients(where?: Prisma.ClientWhereInput) {
    return this.prisma.db.client.count({ where });
  }

  countCollections(where?: Prisma.CollectionWhereInput) {
    return this.prisma.db.collection.count({ where });
  }

  countPieces(where?: Prisma.PieceWhereInput) {
    return this.prisma.db.piece.count({ where });
  }

  countTransfers(where?: Prisma.TransferRequestWhereInput) {
    return this.prisma.db.transferRequest.count({ where });
  }

  countStaffRequests(where?: Prisma.StaffRequestWhereInput) {
    return this.prisma.db.staffRequest.count({ where });
  }

  countCertificatesReady() {
    return this.prisma.db.piece.count({
      where: {
        status: PieceStatus.OWNED,
        certificates: { none: { isActive: true } },
      },
    });
  }

  membershipByClass() {
    return this.prisma.db.class.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        nameAr: true,
        _count: { select: { clients: true } },
      },
    });
  }

  async topCollections(take = 4) {
    const collections = await this.prisma.db.collection.findMany({
      orderBy: { sortOrder: "asc" },
      take,
      select: {
        id: true,
        name: true,
        nameAr: true,
        _count: { select: { pieces: true } },
      },
    });
    if (collections.length === 0) return [];

    const ownerRows = await this.prisma.db.$queryRaw<
      Array<{ collectionId: string; ownerCount: number }>
    >`
      SELECT "collectionId", COUNT(DISTINCT "currentOwnerId")::int AS "ownerCount"
      FROM "Piece"
      WHERE "collectionId" IN (${Prisma.join(collections.map((c) => c.id))})
        AND "currentOwnerId" IS NOT NULL
      GROUP BY "collectionId"
    `;
    const ownerMap = new Map(ownerRows.map((row) => [row.collectionId, row.ownerCount]));

    return collections.map((c) => ({
      id: c.id,
      name: c.name,
      nameAr: c.nameAr,
      pieceCount: c._count.pieces,
      ownerCount: ownerMap.get(c.id) ?? 0,
    }));
  }

  async paidRevenue(from: Date, to: Date) {
    const result = await this.prisma.db.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        paymentStatus: PaymentStatus.PAID,
        placedAt: { gte: from, lt: to },
      },
    });
    return Number(result._sum.totalAmount ?? 0);
  }

  monthlyClientCounts(from: Date) {
    return this.prisma.db.$queryRaw<Array<{ period: Date; count: number }>>`
      SELECT date_trunc('month', "createdAt") AS period, COUNT(*)::int AS count
      FROM "Client"
      WHERE "createdAt" >= ${from}
      GROUP BY 1
      ORDER BY 1
    `;
  }

  monthlyOwnership(from: Date) {
    return Promise.all([
      this.prisma.db.$queryRaw<Array<{ period: Date; count: number }>>`
        SELECT date_trunc('month', "acquiredAt") AS period, COUNT(*)::int AS count
        FROM "OwnershipRecord"
        WHERE "acquiredAt" >= ${from}
        GROUP BY 1
        ORDER BY 1
      `,
      this.prisma.db.$queryRaw<Array<{ period: Date; count: number }>>`
        SELECT date_trunc('month', "completedAt") AS period, COUNT(*)::int AS count
        FROM "TransferRequest"
        WHERE "completedAt" IS NOT NULL AND "completedAt" >= ${from}
        GROUP BY 1
        ORDER BY 1
      `,
      this.prisma.db.$queryRaw<Array<{ period: Date; count: number }>>`
        SELECT date_trunc('month', "initiatedAt") AS period, COUNT(*)::int AS count
        FROM "TransferRequest"
        WHERE "status" NOT IN ('APPROVED', 'REJECTED', 'CANCELLED')
          AND "initiatedAt" >= ${from}
        GROUP BY 1
        ORDER BY 1
      `,
    ]);
  }

  /**
   * The chart only ever renders the leading collections, so the window is picked
   * first and the save/acquisition counts are aggregated once per collection.
   * The previous form ran two correlated subqueries — each a full scan of
   * `SavedPiece` and `OwnershipRecord` joined to `Piece` — for every row in
   * `Collection`, with no limit at either level.
   */
  collectionPerformance(limit = COLLECTION_PERFORMANCE_LIMIT) {
    return this.prisma.db.$queryRaw<
      Array<{
        id: string;
        name: string;
        nameAr: string | null;
        views: number;
        saves: number;
        acquisitions: number;
      }>
    >`
      WITH top_collections AS (
        SELECT c.id, c.name, c."nameAr", c."viewCount", c."sortOrder"
        FROM "Collection" c
        ORDER BY c."viewCount" DESC, c."sortOrder" ASC
        LIMIT ${limit}
      ),
      scoped_pieces AS (
        SELECT p.id, p."collectionId"
        FROM "Piece" p
        JOIN top_collections t ON t.id = p."collectionId"
      )
      SELECT
        t.id,
        t.name,
        t."nameAr" AS "nameAr",
        t."viewCount" AS views,
        COALESCE(s.saves, 0)::int AS saves,
        COALESCE(a.acquisitions, 0)::int AS acquisitions
      FROM top_collections t
      LEFT JOIN (
        SELECT sp2."collectionId", COUNT(*)::int AS saves
        FROM "SavedPiece" sp
        JOIN scoped_pieces sp2 ON sp2.id = sp."pieceId"
        GROUP BY sp2."collectionId"
      ) s ON s."collectionId" = t.id
      LEFT JOIN (
        SELECT sp2."collectionId", COUNT(*)::int AS acquisitions
        FROM "OwnershipRecord" o
        JOIN scoped_pieces sp2 ON sp2.id = o."pieceId"
        GROUP BY sp2."collectionId"
      ) a ON a."collectionId" = t.id
      ORDER BY views DESC, t."sortOrder" ASC
    `;
  }

  pendingReview() {
    return this.countTransfers({ status: TransferStatus.DADAN_REVIEW });
  }

  pendingMembershipRequests() {
    return this.countStaffRequests({
      type: StaffRequestType.MEMBERSHIP_UPGRADE,
      status: StaffRequestStatus.PENDING,
    });
  }
}
