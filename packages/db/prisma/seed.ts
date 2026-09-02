import { randomUUID } from "node:crypto";
import { PrismaClient } from "../generated/client";
import * as bcrypt from "bcrypt";
import { createVerificationToken } from "@dadan/utils";
import { seedAssets, seedCoverKey, seedImageKey, seedLqip, SEED_ASSETS_DIR } from "./seed-assets";
import {
  ALL_REFERENCED_ASSETS,
  CART_ITEMS,
  CERTIFICATES,
  CLIENTS,
  COLLECTIONS,
  DESIGNS,
  ORDERS,
  PIECES,
  SAVED_PIECES,
  TRANSFERS,
  type ClientKey,
} from "./seed-data";

const prisma = new PrismaClient();

const envFlag = process.argv.find((a) => a.startsWith("--environment="));
const targetEnv = envFlag?.split("=")[1] ?? process.env.NODE_ENV;

// Fail closed: an unset NODE_ENV is not treated as "safe to wipe". The wipe
// always needs an explicit opt-in, and production needs a second one.
if (process.env.SEED_ALLOW_DESTRUCTIVE !== "true") {
  console.error(
    "Refusing to seed: this script wipes every table. Set SEED_ALLOW_DESTRUCTIVE=true to proceed.",
  );
  process.exit(1);
}

if (
  targetEnv !== "development" &&
  targetEnv !== "test" &&
  process.env.SEED_ALLOW_PRODUCTION !== "true"
) {
  console.error(
    "Refusing to seed: environment is not development/test. Set SEED_ALLOW_PRODUCTION=true to override.",
  );
  process.exit(1);
}

const HOUSE_KEY_SALT_ROUNDS = parseInt(process.env.HOUSE_KEY_SALT ?? "12", 10);
if (!process.env.SEED_ADMIN_PASSWORD) {
  console.error(
    "Refusing to seed: SEED_ADMIN_PASSWORD is required (no default password).",
  );
  process.exit(1);
}
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const CERT_SIGNING_SECRET =
  process.env.CERT_SIGNING_SECRET ?? "dev-cert-signing-secret-local-only";
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const TAX_RATE = 0.15;

async function hashHouseKey(plain: string): Promise<string> {
  return bcrypt.hash(plain, HOUSE_KEY_SALT_ROUNDS);
}

const ACTIVE_TRANSFER_STATUSES = new Set([
  "INITIATED",
  "SENDER_CONFIRMED",
  "RECIPIENT_CONFIRMED",
  "DADAN_REVIEW",
]);

async function main() {
  console.log(
    `\nSeeding DADAN database (env=${targetEnv ?? "development"}) — single source of truth.\n`,
  );

  // --- Assets: wipe storage, upload exactly the referenced files, build LQIPs ---
  const assetResult = await seedAssets();
  console.log(`  Assets: ${assetResult.uploaded} uploaded (${SEED_ASSETS_DIR})\n`);

  const lqips: Record<string, string> = {};
  for (const filename of ALL_REFERENCED_ASSETS) {
    lqips[filename] = await seedLqip(filename);
  }

  // --- Credentials (hashed once, reused across the run) ---
  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const houseKeyHashes: Record<ClientKey, string> = {} as Record<ClientKey, string>;
  for (const client of CLIENTS) {
    houseKeyHashes[client.key] = await hashHouseKey(client.houseKeyPlain);
  }

  await prisma.$transaction(async (tx) => {
    // --- Wipe every table (deterministic reset) ---
    await tx.cartItem.deleteMany();
    await tx.savedPiece.deleteMany();
    await tx.verificationLog.deleteMany();
    await tx.transferRequest.deleteMany();
    await tx.orderItem.deleteMany();
    await tx.order.deleteMany();
    await tx.certificate.deleteMany();
    await tx.ownershipRecord.deleteMany();
    await tx.piece.deleteMany();
    await tx.designSpecification.deleteMany();
    await tx.design.deleteMany();
    await tx.collection.deleteMany();
    await tx.client.deleteMany();
    await tx.adminUser.deleteMany();
    await tx.auditLog.deleteMany();
    await tx.failedRefund.deleteMany();
    console.log("Cleared all tables.\n");

    // --- Admin users ---
    const adminSeeds = [
      { email: "admin@dadan.sa", displayName: "DADAN Super Admin", role: "SUPER_ADMIN" as const },
      { email: "staff@dadan.sa", displayName: "DADAN Staff", role: "STAFF" as const },
      { email: "viewer@dadan.sa", displayName: "DADAN Viewer", role: "VIEWER" as const },
    ];
    const admins: Array<{ id: string; email: string }> = [];
    for (const a of adminSeeds) {
      admins.push(
        await tx.adminUser.create({ data: { ...a, passwordHash: adminPasswordHash } }),
      );
    }

    // --- Clients ---
    const clients = new Map<ClientKey, { id: string }>();
    for (const c of CLIENTS) {
      const client = await tx.client.create({
        data: {
          houseId: c.houseId,
          houseKey: houseKeyHashes[c.key],
          houseKeyPrefix: c.houseKeyPlain.slice(0, 4),
          displayName: c.displayName,
          email: c.email,
          locale: c.locale,
          visibilityGroups: c.visibilityGroups,
        },
      });
      clients.set(c.key, client);
    }

    // --- Collections ---
    const collections = new Map<string, { id: string }>();
    for (const c of COLLECTIONS) {
      const collection = await tx.collection.create({
        data: {
          name: c.name,
          nameAr: c.nameAr,
          slug: c.slug,
          description: c.description,
          descriptionAr: c.descriptionAr,
          coverImageUrl: seedCoverKey(c.cover),
          coverImageLqip: lqips[c.cover],
          isVisible: true,
          sortOrder: c.sortOrder,
          visibilityGroups: c.visibilityGroups,
        },
      });
      collections.set(c.slug, collection);
    }

    // --- Designs + specifications ---
    const designs = new Map<string, { id: string }>();
    const basePrices = new Map<string, number>();
    for (const d of DESIGNS) {
      const design = await tx.design.create({
        data: {
          name: d.name,
          nameAr: d.nameAr,
          slug: d.slug,
          collectionId: collections.get(d.collectionSlug)!.id,
          story: d.story,
          storyAr: d.storyAr,
          material: d.material,
          materialAr: d.materialAr,
          weight: d.weight,
          dimensions: d.dimensions,
          dimensionsAr: d.dimensionsAr,
          imageUrls: d.images.map(seedImageKey),
          imageLqips: d.images.map((f) => lqips[f]),
          basePrice: d.basePrice,
          currency: "SAR",
          isActive: true,
          visibilityGroups: d.visibilityGroups,
          specifications: { create: d.specifications },
        },
      });
      designs.set(d.slug, design);
      basePrices.set(d.slug, d.basePrice);
    }

    // --- Pieces + initial ownership records ---
    const serialToDesignSlug = new Map(PIECES.map((p) => [p.serialNumber, p.designSlug]));
    const pieces = new Map<string, { id: string }>();
    for (const p of PIECES) {
      const piece = await tx.piece.create({
        data: {
          serialNumber: p.serialNumber,
          designId: designs.get(p.designSlug)!.id,
          status: p.status ?? (p.ownerKey ? "OWNED" : "AVAILABLE"),
          currentOwnerId: p.ownerKey ? clients.get(p.ownerKey)!.id : null,
          registeredAt: new Date(),
        },
      });
      pieces.set(p.serialNumber, piece);

      if (p.ownerKey) {
        await tx.ownershipRecord.create({
          data: {
            pieceId: piece.id,
            clientId: clients.get(p.ownerKey)!.id,
            acquisitionType: "PURCHASE",
            notes: "Initial seed ownership",
          },
        });
      }
    }

    // --- Certificates (verification token needs the certificate id first) ---
    for (const c of CERTIFICATES) {
      const certificateId = randomUUID();
      const token = createVerificationToken(
        c.serialNumber,
        certificateId,
        CERT_SIGNING_SECRET,
      );
      await tx.certificate.create({
        data: {
          id: certificateId,
          pieceId: pieces.get(c.serialNumber)!.id,
          ownerId: clients.get(c.ownerKey)!.id,
          certificateNumber: c.certificateNumber,
          isActive: true,
          qrCodeData: `${BASE_URL}/verify?serial=${encodeURIComponent(c.serialNumber)}&token=${token}`,
          templateVersion: "1.0",
        },
      });
    }

    // --- Orders ---
    for (const o of ORDERS) {
      const items = o.pieceSerials.map((serial) => {
        const designSlug = serialToDesignSlug.get(serial)!;
        const price = basePrices.get(designSlug)!;
        const itemTax = Math.round(price * TAX_RATE * 100) / 100;
        return {
          pieceId: pieces.get(serial)!.id,
          designId: designs.get(designSlug)!.id,
          priceAtPurchase: price,
          taxRate: TAX_RATE,
          taxAmount: itemTax,
          lineTotal: Math.round((price + itemTax) * 100) / 100,
          currency: "SAR",
        };
      });
      const subtotal = items.reduce((sum, item) => sum + item.priceAtPurchase, 0);
      const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;

      await tx.order.create({
        data: {
          clientId: clients.get(o.clientKey)!.id,
          status: o.status,
          paymentStatus: o.status === "CANCELLED" ? "REFUNDED" : "PAID",
          fulfillmentStatus: o.status === "FULFILLED" ? "DELIVERED" : "UNFULFILLED",
          subtotalAmount: subtotal,
          taxAmount,
          taxRate: TAX_RATE,
          totalAmount: Math.round((subtotal + taxAmount) * 100) / 100,
          currency: "SAR",
          paymentProvider: "mock",
          paymentMethod: "MADA",
          paymentReference: `seed_${o.pieceSerials[0]}`,
          shippingAddress: {
            fullName: "Seed Client",
            line1: "King Fahd Road",
            city: "Riyadh",
            region: "Riyadh",
            country: "SA",
            postalCode: "11564",
            phone: "+966500000000",
          },
          items: { create: items },
        },
      });
    }

    // --- Saved pieces ---
    for (const s of SAVED_PIECES) {
      await tx.savedPiece.create({
        data: {
          clientId: clients.get(s.clientKey)!.id,
          pieceId: pieces.get(s.serialNumber)!.id,
        },
      });
    }

    // --- Cart items ---
    for (const c of CART_ITEMS) {
      await tx.cartItem.create({
        data: {
          clientId: clients.get(c.clientKey)!.id,
          pieceId: pieces.get(c.serialNumber)!.id,
        },
      });
    }

    // --- Transfers (in-flight pieces become TRANSFER_PENDING) ---
    for (const t of TRANSFERS) {
      await tx.transferRequest.create({
        data: {
          pieceId: pieces.get(t.pieceSerialNumber)!.id,
          fromClientId: clients.get(t.fromClientKey)!.id,
          toClientId: clients.get(t.toClientKey)!.id,
          transferType: t.transferType,
          status: t.status,
          senderConfirmedAt: t.senderConfirmed ? new Date() : null,
          recipientConfirmedAt: t.recipientConfirmed ? new Date() : null,
          initiatedAt: new Date(),
        },
      });
      if (ACTIVE_TRANSFER_STATUSES.has(t.status)) {
        await tx.piece.update({
          where: { id: pieces.get(t.pieceSerialNumber)!.id },
          data: { status: "TRANSFER_PENDING" },
        });
      }
    }

    // --- Summary ---
    console.log("=== Seed Summary ===");
    console.log(`  Admins:       ${admins.length} created`);
    console.log(`  Clients:      ${CLIENTS.length} created`);
    console.log(`  Collections:  ${COLLECTIONS.length} created`);
    console.log(`  Designs:      ${DESIGNS.length} created`);
    console.log(`  Pieces:       ${PIECES.length} created`);
    console.log(`  Certificates: ${CERTIFICATES.length} created`);
    console.log(`  Orders:       ${ORDERS.length} created`);
    console.log(`  Saved Pieces: ${SAVED_PIECES.length} created`);
    console.log(`  Cart Items:   ${CART_ITEMS.length} created`);
    console.log(`  Transfers:    ${TRANSFERS.length} created`);
    console.log("");
    console.log("Test House Keys (plaintext — dev only):");
    for (const c of CLIENTS) {
      console.log(`  ${c.displayName}: ${c.houseKeyPlain}`);
    }
    console.log(
      `Admin logins: admin@dadan.sa / staff@dadan.sa / viewer@dadan.sa (password: ${ADMIN_PASSWORD})`,
    );
    console.log(`Super admin id: ${admins[0].id}, staff id: ${admins[1].id}`);
  });

  console.log("\nSeed complete.\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
