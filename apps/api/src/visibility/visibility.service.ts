import { Injectable } from "@nestjs/common";
import type { Prisma } from "@dadan/db";

export type CollectionClassFilter = Prisma.CollectionWhereInput;

@Injectable()
export class VisibilityService {
  /**
   * A collection is visible to a client only when it is published and assigned
   * to the client's class. Empty CollectionClass = visible to nobody.
   */
  prismaFilter(classId: string): CollectionClassFilter {
    return {
      isVisible: true,
      classes: { some: { classId } },
    };
  }

  canAccessCollection(
    classId: string,
    collection: { isVisible: boolean; classes: { classId: string }[] },
  ): boolean {
    return (
      collection.isVisible &&
      collection.classes.some((row) => row.classId === classId)
    );
  }

  canAccessPiece(
    classId: string,
    piece: {
      isActive: boolean;
      collection: { isVisible: boolean; classes: { classId: string }[] };
    },
  ): boolean {
    return piece.isActive && this.canAccessCollection(classId, piece.collection);
  }
}
