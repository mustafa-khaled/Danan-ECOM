import { PrismaClient } from "../generated/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const HOUSE_KEY_SALT_ROUNDS = parseInt(process.env.HOUSE_KEY_SALT ?? "12", 10);

async function hashHouseKey(plain: string): Promise<string> {
  return bcrypt.hash(plain, HOUSE_KEY_SALT_ROUNDS);
}

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

async function main() {
  console.log("Seeding DADAN Dijital database...");

  const adminPassword = await hashPassword("AdminPass123!");

  const superAdmin = await prisma.adminUser.upsert({
    where: { email: "admin@dadan.sa" },
    update: {},
    create: {
      email: "admin@dadan.sa",
      passwordHash: adminPassword,
      displayName: "DADAN Super Admin",
      role: "SUPER_ADMIN",
    },
  });

  const staffAdmin = await prisma.adminUser.upsert({
    where: { email: "staff@dadan.sa" },
    update: {},
    create: {
      email: "staff@dadan.sa",
      passwordHash: adminPassword,
      displayName: "DADAN Staff",
      role: "STAFF",
    },
  });

  const clientSeeds = [
    {
      houseKeyPlain: "dadan-vip-key-001",
      displayName: "Amira Al-Rashid",
      email: "amira@example.com",
      visibilityGroups: ["vip", "collection-noir", "riyadh"],
    },
    {
      houseKeyPlain: "dadan-key-002",
      displayName: "Khalid Al-Farsi",
      email: "khalid@example.com",
      visibilityGroups: ["standard", "riyadh"],
    },
    {
      houseKeyPlain: "dadan-key-003",
      displayName: "Layla Al-Mutairi",
      email: "layla@example.com",
      visibilityGroups: ["vip", "collection-gold"],
    },
  ];

  const clients = [];
  for (const c of clientSeeds) {
    const hashed = await hashHouseKey(c.houseKeyPlain);
    const client = await prisma.client.upsert({
      where: { email: c.email },
      update: {},
      create: {
        houseKey: hashed,
        houseKeyPrefix: c.houseKeyPlain.slice(0, 4),
        displayName: c.displayName,
        email: c.email,
        visibilityGroups: c.visibilityGroups,
      },
    });
    clients.push(client);
  }

  const [amira, khalid, layla] = clients;

  const collectionNoir = await prisma.collection.upsert({
    where: { slug: "noir-collection" },
    update: {},
    create: {
      name: "Collection Noir",
      slug: "noir-collection",
      description: "Midnight elegance — black gold and onyx.",
      isVisible: true,
      sortOrder: 1,
      visibilityGroups: ["vip", "collection-noir"],
    },
  });

  const collectionGold = await prisma.collection.upsert({
    where: { slug: "gold-heritage" },
    update: {},
    create: {
      name: "Gold Heritage",
      slug: "gold-heritage",
      description: "Traditional Saudi craftsmanship in warm gold.",
      isVisible: true,
      sortOrder: 2,
      visibilityGroups: ["vip", "collection-gold", "standard"],
    },
  });

  const designs = await Promise.all([
    prisma.design.upsert({
      where: { slug: "noir-ring-01" },
      update: {},
      create: {
        name: "Noir Solitaire Ring",
        slug: "noir-ring-01",
        collectionId: collectionNoir.id,
        story: "A single black diamond set in brushed gold — the signature of Collection Noir.",
        material: "18K Gold, Black Diamond",
        weight: 4.2,
        dimensions: "Ring size 54",
        imageUrls: ["designs/placeholder/noir-ring.jpg"],
        basePrice: 45000,
        visibilityGroups: ["vip", "collection-noir"],
        specifications: {
          create: [
            { key: "Stone", value: "Black Diamond", sortOrder: 1 },
            { key: "Carat", value: "1.2 ct", sortOrder: 2 },
          ],
        },
      },
    }),
    prisma.design.upsert({
      where: { slug: "noir-necklace-01" },
      update: {},
      create: {
        name: "Noir Cascade Necklace",
        slug: "noir-necklace-01",
        collectionId: collectionNoir.id,
        story: "Graduated onyx beads with a gold clasp — movement and shadow.",
        material: "18K Gold, Onyx",
        weight: 28.5,
        dimensions: "45 cm chain",
        imageUrls: ["designs/placeholder/noir-necklace.jpg"],
        basePrice: 62000,
        visibilityGroups: ["vip", "collection-noir"],
      },
    }),
    prisma.design.upsert({
      where: { slug: "heritage-bracelet-01" },
      update: {},
      create: {
        name: "Heritage Cuff Bracelet",
        slug: "heritage-bracelet-01",
        collectionId: collectionGold.id,
        story: "Hand-engraved Arabic calligraphy on a solid gold cuff.",
        material: "22K Gold",
        weight: 35.0,
        dimensions: "6.5 cm diameter",
        imageUrls: ["designs/placeholder/heritage-bracelet.jpg"],
        basePrice: 78000,
        visibilityGroups: ["vip", "collection-gold", "standard"],
      },
    }),
    prisma.design.upsert({
      where: { slug: "heritage-earrings-01" },
      update: {},
      create: {
        name: "Heritage Drop Earrings",
        slug: "heritage-earrings-01",
        collectionId: collectionGold.id,
        story: "Pear-shaped emeralds suspended from gold filigree.",
        material: "18K Gold, Emerald",
        weight: 8.3,
        dimensions: "3.2 cm drop",
        imageUrls: ["designs/placeholder/heritage-earrings.jpg"],
        basePrice: 55000,
        visibilityGroups: ["collection-gold", "standard"],
      },
    }),
  ]);

  const serials = [
    "DADAN-2025-NR-000001",
    "DADAN-2025-NR-000002",
    "DADAN-2025-NR-000003",
    "DADAN-2025-GH-000001",
    "DADAN-2025-GH-000002",
    "DADAN-2025-GH-000003",
  ];

  const pieces = [];
  for (let i = 0; i < 6; i++) {
    const design = designs[i < 2 ? 0 : i < 3 ? 1 : i < 4 ? 2 : 3]!;
    const isOwned = i < 2;
    const piece = await prisma.piece.upsert({
      where: { serialNumber: serials[i]! },
      update: {},
      create: {
        serialNumber: serials[i]!,
        designId: design.id,
        status: isOwned ? "OWNED" : "AVAILABLE",
        currentOwnerId: isOwned ? amira!.id : null,
        registeredAt: new Date(),
      },
    });
    pieces.push(piece);

    if (isOwned) {
      await prisma.ownershipRecord.create({
        data: {
          pieceId: piece.id,
          clientId: amira!.id,
          acquisitionType: "PURCHASE",
          notes: "Initial seed ownership",
        },
      });
    }
  }

  const cert1 = await prisma.certificate.create({
    data: {
      pieceId: pieces[0]!.id,
      ownerId: amira!.id,
      certificateNumber: "CERT-2025-A3F1C09B",
      isActive: true,
      pdfUrl: `certificates/${pieces[0]!.id}.pdf`,
      qrCodeData: "https://dadan.sa/verify?serial=DADAN-2025-NR-000001&token=seed",
      templateVersion: "1.0",
    },
  });

  await prisma.certificate.create({
    data: {
      pieceId: pieces[1]!.id,
      ownerId: amira!.id,
      certificateNumber: "CERT-2025-B7E2D04A",
      isActive: true,
      pdfUrl: `certificates/${pieces[1]!.id}.pdf`,
      qrCodeData: "https://dadan.sa/verify?serial=DADAN-2025-NR-000002&token=seed",
      templateVersion: "1.0",
    },
  });

  await prisma.transferRequest.create({
    data: {
      pieceId: pieces[0]!.id,
      fromClientId: amira!.id,
      toClientId: khalid!.id,
      transferType: "GIFT",
      status: "DADAN_REVIEW",
      senderConfirmedAt: new Date(),
      recipientConfirmedAt: new Date(),
      initiatedAt: new Date(),
    },
  });

  console.log("Seed complete.");
  console.log("Test House Keys (plaintext — dev only):");
  for (const c of clientSeeds) {
    console.log(`  ${c.displayName}: ${c.houseKeyPlain}`);
  }
  console.log(`Admin login: admin@dadan.sa / AdminPass123!`);
  console.log(`Super admin id: ${superAdmin.id}, staff id: ${staffAdmin.id}`);
  console.log(`Certificate 1: ${cert1.certificateNumber}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
