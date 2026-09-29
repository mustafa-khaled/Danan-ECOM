/**
 * Backfills certificates for owned pieces that never received one.
 *
 * The transactional outbox was the only writer of certificates, and its
 * dispatcher used a `jobId` containing ":", which BullMQ rejects outright. Every
 * enqueue therefore failed with `Custom Id cannot contain :`, so pieces that were
 * assigned an owner outside the seeded fixture set never got a certificate even
 * though the outbox row was written and retried indefinitely.
 *
 * This script does not render anything itself. It enqueues outbox rows and lets
 * the API's dispatcher drive the real generation pipeline, so the fix is
 * exercised end to end rather than bypassed.
 *
 * Safe to re-run: pieces that already have an active certificate, or that
 * already have an undispatched outbox row, are skipped.
 */
import { PrismaClient } from "../generated/client";

const prisma = new PrismaClient();

async function main() {
  const pieces = await prisma.piece.findMany({
    where: {
      status: "OWNED",
      certificates: { none: { isActive: true } },
    },
    select: {
      id: true,
      serialNumber: true,
      name: true,
      currentOwnerId: true,
      ownershipRecords: {
        where: { transferredAt: null },
        select: { acquiredAt: true },
        take: 1,
      },
      orderItems: {
        select: { orderId: true },
        orderBy: { order: { createdAt: "desc" } },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (pieces.length === 0) {
    console.log("No owned pieces are missing a certificate. Nothing to do.");
    return;
  }

  const skippedNoOwner: string[] = [];
  const skippedAlreadyQueued: string[] = [];
  const queued: string[] = [];

  for (const piece of pieces) {
    if (!piece.currentOwnerId) {
      skippedNoOwner.push(`${piece.serialNumber} (${piece.id})`);
      continue;
    }

    const existing = await prisma.certificateOutbox.findFirst({
      where: { pieceId: piece.id, dispatchedAt: null },
      select: { id: true },
    });
    if (existing) {
      skippedAlreadyQueued.push(`${piece.serialNumber} (${existing.id})`);
      continue;
    }

    // Purely for traceability on the outbox row — generation itself is keyed
    // on the piece and its current owner.
    const orderId = piece.orderItems[0]?.orderId;
    await prisma.certificateOutbox.create({
      data: {
        pieceId: piece.id,
        clientId: piece.currentOwnerId,
        ...(orderId ? { orderId } : {}),
      },
    });
    queued.push(`${piece.serialNumber} — ${piece.name} (${piece.id})`);
  }

  console.log(`Queued ${queued.length} certificate generation(s):`);
  for (const line of queued) console.log(`  + ${line}`);

  if (skippedAlreadyQueued.length > 0) {
    console.log(`\nSkipped ${skippedAlreadyQueued.length} already-queued piece(s):`);
    for (const line of skippedAlreadyQueued) console.log(`  = ${line}`);
  }

  if (skippedNoOwner.length > 0) {
    console.log(`\nSkipped ${skippedNoOwner.length} piece(s) with no current owner:`);
    for (const line of skippedNoOwner) console.log(`  ! ${line}`);
  }

  console.log(
    "\nThe API dispatcher runs every minute — certificates appear within ~60s of the enqueue.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
