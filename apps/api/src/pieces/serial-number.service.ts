import { Injectable } from "@nestjs/common";
import type { Prisma } from "@dadan/db";
import { collectionCodeFromSlug, generateSerialNumber } from "@dadan/utils";

/** Namespace for the piece sequence: one counter per collection per year. */
export function pieceSerialScope(collectionId: string, year: number): string {
  return `piece:${collectionId}:${year}`;
}

@Injectable()
export class SerialNumberService {
  /**
   * Allocates the next serial for a collection.
   *
   * Must be called with the same `tx` that inserts the piece. The counter row is
   * locked by the `ON CONFLICT DO UPDATE` until that transaction commits, so a
   * concurrent registration in the same collection waits and then reads the
   * already-incremented value — the previous `COUNT(*)`-based approach let two
   * writers derive the same sequence, and reused numbers after a piece was
   * deleted.
   */
  async allocateForCollection(
    tx: Prisma.TransactionClient,
    collectionId: string,
  ): Promise<string> {
    const collection = await tx.collection.findUniqueOrThrow({
      where: { id: collectionId },
      select: { slug: true },
    });

    const year = new Date().getFullYear();
    const scope = pieceSerialScope(collectionId, year);

    const rows = await tx.$queryRaw<Array<{ lastSequence: number }>>`
      INSERT INTO "SerialCounter" ("scope", "lastSequence", "updatedAt")
      VALUES (${scope}::text, 1, now())
      ON CONFLICT ("scope") DO UPDATE
        SET "lastSequence" = "SerialCounter"."lastSequence" + 1,
            "updatedAt" = now()
      RETURNING "lastSequence"
    `;

    const allocated = rows[0]?.lastSequence;
    if (allocated === undefined) {
      throw new Error(`Serial allocation returned no row for scope ${scope}`);
    }

    return generateSerialNumber(
      year,
      collectionCodeFromSlug(collection.slug),
      allocated,
    );
  }
}
