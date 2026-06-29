import { Injectable } from "@nestjs/common";
import {
  collectionCodeFromSlug,
  generateSerialNumber,
} from "@dadan/utils";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SerialNumberService {
  constructor(private readonly prisma: PrismaService) {}

  async generateForDesign(designId: string): Promise<string> {
    return this.prisma.db.$transaction(async (tx) => {
      const design = await tx.design.findUniqueOrThrow({
        where: { id: designId },
        include: { collection: true },
      });

      const collectionCode = collectionCodeFromSlug(design.collection.slug);
      const year = new Date().getFullYear();

      const count = await tx.piece.count({
        where: {
          design: { collectionId: design.collectionId },
        },
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
