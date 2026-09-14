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

  collectionPerformance() {
    return this.prisma.db.$queryRaw<
      Array<{
        id: string;
        name: string;
        views: number;
        saves: number;
        acquisitions: number;
      }>
    >`
      SELECT
        c.id,
        c.name,
        c."viewCount" AS views,
        (
          SELECT COUNT(*)::int
          FROM "SavedPiece" sp
          JOIN "Piece" p ON p.id = sp."pieceId"
          WHERE p."collectionId" = c.id
        ) AS saves,
        (
          SELECT COUNT(*)::int
          FROM "OwnershipRecord" o
          JOIN "Piece" p ON p.id = o."pieceId"
          WHERE p."collectionId" = c.id
        ) AS acquisitions
      FROM "Collection" c
      ORDER BY views DESC, c."sortOrder" ASC
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
