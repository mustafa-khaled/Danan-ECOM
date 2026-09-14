import { Injectable } from "@nestjs/common";
import { collectionCodeFromSlug, generateSerialNumber } from "@dadan/utils";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SerialNumberService {
  constructor(private readonly prisma: PrismaService) {}

  async generateForCollection(collectionId: string): Promise<string> {
    return this.prisma.db.$transaction(async (tx) => {
      const collection = await tx.collection.findUniqueOrThrow({
        where: { id: collectionId },
        select: { id: true, slug: true },
      });

      const collectionCode = collectionCodeFromSlug(collection.slug);
      const year = new Date().getFullYear();

      const count = await tx.piece.count({
        where: { collectionId: collection.id },
      });

      const serialNumber = generateSerialNumber(year, collectionCode, count + 1);

      const existing = await tx.piece.findUnique({ where: { serialNumber } });
      if (existing) {
        throw new Error("Serial number collision — retry");
      }

      return serialNumber;
    });
  }
}
