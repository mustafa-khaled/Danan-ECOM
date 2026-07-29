import { randomUUID } from "node:crypto";
import { PrismaClient } from "../generated/client";
import * as bcrypt from "bcrypt";
import { createVerificationToken } from "@dadan/utils";
import { seedAssets, seedImageKey } from "./seed-assets";

const prisma = new PrismaClient();

// Refuse to run against production unless explicitly allowed: the seed
// contains well-known credentials and demo data.
if (
  process.env.NODE_ENV === "production" &&
  process.env.SEED_ALLOW_PRODUCTION !== "true"
) {
  console.error(
    "Refusing to seed: NODE_ENV=production. Set SEED_ALLOW_PRODUCTION=true to override.",
  );
  process.exit(1);
}

const HOUSE_KEY_SALT_ROUNDS = parseInt(process.env.HOUSE_KEY_SALT ?? "12", 10);
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "AdminPass123!";
const CERT_SIGNING_SECRET =
  process.env.CERT_SIGNING_SECRET ?? "dev-cert-signing-secret-local-only";
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

async function hashHouseKey(plain: string): Promise<string> {
  return bcrypt.hash(plain, HOUSE_KEY_SALT_ROUNDS);
}

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

interface SpecSeed {
  key: string;
  keyAr: string;
  value: string;
  valueAr: string;
  sortOrder: number;
}

interface DesignSeed {
  slug: string;
  name: string;
  nameAr: string;
  story: string;
  storyAr: string;
  material: string;
  materialAr: string;
  weight: number;
  dimensions: string;
  dimensionsAr: string;
  image: string;
  basePrice: number;
  visibilityGroups: string[];
  specifications: SpecSeed[];
}

async function main() {
  console.log("Seeding DADAN Dijital database...");

  await seedAssets();

  // --- Admin users ---
  const adminPassword = await hashPassword(ADMIN_PASSWORD);

  const superAdmin = await prisma.adminUser.upsert({
    where: { email: "admin@dadan.sa" },
    update: { passwordHash: adminPassword },
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

  await prisma.adminUser.upsert({
    where: { email: "viewer@dadan.sa" },
    update: {},
    create: {
      email: "viewer@dadan.sa",
      passwordHash: adminPassword,
      displayName: "DADAN Viewer",
      role: "VIEWER",
    },
  });

  // --- Clients ---
  const clientSeeds = [
    {
      houseKeyPlain: process.env.SEED_HOUSE_KEY_1 ?? "dadan-vip-key-001",
      displayName: "أميرة الراشد",
      email: "amira@example.com",
      locale: "ar",
      visibilityGroups: [
        "vip",
        "collection-noir",
        "collection-oasis",
        "riyadh",
      ],
    },
    {
      houseKeyPlain: process.env.SEED_HOUSE_KEY_2 ?? "dadan-key-002",
      displayName: "خالد الفارسي",
      email: "khalid@example.com",
      locale: "ar",
      visibilityGroups: ["standard", "riyadh"],
    },
    {
      houseKeyPlain: process.env.SEED_HOUSE_KEY_3 ?? "dadan-key-003",
      displayName: "Layla Al-Mutairi",
      email: "layla@example.com",
      locale: "en",
      visibilityGroups: ["vip", "collection-gold", "collection-oasis"],
    },
  ];

  const clients = [];
  for (const c of clientSeeds) {
    const hashed = await hashHouseKey(c.houseKeyPlain);
    const client = await prisma.client.upsert({
      where: { email: c.email },
      update: {
        displayName: c.displayName,
        locale: c.locale,
        visibilityGroups: c.visibilityGroups,
      },
      create: {
        houseKey: hashed,
        houseKeyPrefix: c.houseKeyPlain.slice(0, 4),
        displayName: c.displayName,
        email: c.email,
        locale: c.locale,
        visibilityGroups: c.visibilityGroups,
      },
    });
    clients.push(client);
  }

  const [amira, khalid, layla] = clients;

  // --- Collections (bilingual) ---
  const collectionNoir = await prisma.collection.upsert({
    where: { slug: "noir-collection" },
    update: {
      nameAr: "تشكيلة نوار",
      descriptionAr: "أناقة منتصف الليل — ذهب أسود وعقيق يماني.",
    },
    create: {
      name: "Collection Noir",
      nameAr: "تشكيلة نوار",
      slug: "noir-collection",
      description: "Midnight elegance — black gold and onyx.",
      descriptionAr: "أناقة منتصف الليل — ذهب أسود وعقيق يماني.",
      coverImageUrl: seedImageKey("noir-necklace.jpg"),
      isVisible: true,
      sortOrder: 1,
      visibilityGroups: ["vip", "collection-noir"],
    },
  });

  const collectionGold = await prisma.collection.upsert({
    where: { slug: "gold-heritage" },
    update: {
      nameAr: "تراث الذهب",
      descriptionAr: "حِرفية سعودية أصيلة بذهب دافئ.",
    },
    create: {
      name: "Gold Heritage",
      nameAr: "تراث الذهب",
      slug: "gold-heritage",
      description: "Traditional Saudi craftsmanship in warm gold.",
      descriptionAr: "حِرفية سعودية أصيلة بذهب دافئ.",
      coverImageUrl: seedImageKey("heritage-bracelet.jpg"),
      isVisible: true,
      sortOrder: 2,
      visibilityGroups: ["vip", "collection-gold", "standard"],
    },
  });

  const collectionOasis = await prisma.collection.upsert({
    where: { slug: "oasis" },
    update: {},
    create: {
      name: "Oasis",
      nameAr: "الواحة",
      slug: "oasis",
      description: "Light, water and stone — a modern desert reverie.",
      descriptionAr: "ضوء وماء وحجر — حلم صحراوي معاصر.",
      coverImageUrl: seedImageKey("oasis-choker.jpg"),
      isVisible: true,
      sortOrder: 3,
      visibilityGroups: ["vip", "collection-oasis"],
    },
  });

  // --- Designs (bilingual) ---
  const designSeeds: (DesignSeed & { collectionId: string })[] = [
    {
      slug: "noir-ring-01",
      name: "Noir Solitaire Ring",
      nameAr: "خاتم نوار سوليتير",
      story:
        "A single black diamond set in brushed gold — the signature of Collection Noir.",
      storyAr: "ماسة سوداء واحدة مرصعة في ذهب مصقول — توقيع تشكيلة نوار.",
      material: "18K Gold, Black Diamond",
      materialAr: "ذهب ١٨ قيراط، ماس أسود",
      weight: 4.2,
      dimensions: "Ring size 54",
      dimensionsAr: "مقاس الخاتم ٥٤",
      image: "noir-ring.jpg",
      basePrice: 45000,
      visibilityGroups: ["vip", "collection-noir"],
      collectionId: collectionNoir.id,
      specifications: [
        {
          key: "Stone",
          keyAr: "الحجر",
          value: "Black Diamond",
          valueAr: "ماس أسود",
          sortOrder: 1,
        },
        {
          key: "Carat",
          keyAr: "القيراط",
          value: "1.2 ct",
          valueAr: "١٫٢ قيراط",
          sortOrder: 2,
        },
      ],
    },
    {
      slug: "noir-necklace-01",
      name: "Noir Cascade Necklace",
      nameAr: "عقد نوار المتدرج",
      story: "Graduated onyx beads with a gold clasp — movement and shadow.",
      storyAr: "حبات عقيق متدرجة بمشبك ذهبي — حركة وظلال.",
      material: "18K Gold, Onyx",
      materialAr: "ذهب ١٨ قيراط، عقيق يماني",
      weight: 28.5,
      dimensions: "45 cm chain",
      dimensionsAr: "سلسلة ٤٥ سم",
      image: "noir-necklace.jpg",
      basePrice: 62000,
      visibilityGroups: ["vip", "collection-noir"],
      collectionId: collectionNoir.id,
      specifications: [
        {
          key: "Stone",
          keyAr: "الحجر",
          value: "Onyx",
          valueAr: "عقيق يماني",
          sortOrder: 1,
        },
        {
          key: "Clasp",
          keyAr: "المشبك",
          value: "18K Gold",
          valueAr: "ذهب ١٨ قيراط",
          sortOrder: 2,
        },
      ],
    },
    {
      slug: "noir-earrings-01",
      name: "Noir Stud Earrings",
      nameAr: "أقراط نوار",
      story: "Black diamond studs in dark rhodium — quiet defiance.",
      storyAr: "أقراط ماس أسود بطلاء روديوم داكن — تحدٍّ هادئ.",
      material: "18K Gold, Black Diamond",
      materialAr: "ذهب ١٨ قيراط، ماس أسود",
      weight: 3.1,
      dimensions: "0.8 cm studs",
      dimensionsAr: "أقراط ٠٫٨ سم",
      image: "noir-earrings.jpg",
      basePrice: 38000,
      visibilityGroups: ["vip", "collection-noir"],
      collectionId: collectionNoir.id,
      specifications: [
        {
          key: "Stone",
          keyAr: "الحجر",
          value: "Black Diamond",
          valueAr: "ماس أسود",
          sortOrder: 1,
        },
      ],
    },
    {
      slug: "heritage-bracelet-01",
      name: "Heritage Cuff Bracelet",
      nameAr: "سوار التراث",
      story: "Hand-engraved Arabic calligraphy on a solid gold cuff.",
      storyAr: "خط عربي محفور يدويًا على سوار من الذهب الخالص.",
      material: "22K Gold",
      materialAr: "ذهب ٢٢ قيراط",
      weight: 35.0,
      dimensions: "6.5 cm diameter",
      dimensionsAr: "قطر ٦٫٥ سم",
      image: "heritage-bracelet.jpg",
      basePrice: 78000,
      visibilityGroups: ["vip", "collection-gold", "standard"],
      collectionId: collectionGold.id,
      specifications: [
        {
          key: "Engraving",
          keyAr: "النقش",
          value: "Hand-engraved calligraphy",
          valueAr: "خط عربي محفور يدويًا",
          sortOrder: 1,
        },
      ],
    },
    {
      slug: "heritage-earrings-01",
      name: "Heritage Drop Earrings",
      nameAr: "أقراط التراث المتدلية",
      story: "Pear-shaped emeralds suspended from gold filigree.",
      storyAr: "زمرد على شكل كمثرى متدلٍّ من زخارف ذهبية دقيقة.",
      material: "18K Gold, Emerald",
      materialAr: "ذهب ١٨ قيراط، زمرد",
      weight: 8.3,
      dimensions: "3.2 cm drop",
      dimensionsAr: "تدلٍّ ٣٫٢ سم",
      image: "heritage-earrings.jpg",
      basePrice: 55000,
      visibilityGroups: ["collection-gold", "standard"],
      collectionId: collectionGold.id,
      specifications: [
        {
          key: "Stone",
          keyAr: "الحجر",
          value: "Emerald",
          valueAr: "زمرد",
          sortOrder: 1,
        },
        {
          key: "Cut",
          keyAr: "القطع",
          value: "Pear",
          valueAr: "كمثرى",
          sortOrder: 2,
        },
      ],
    },
    {
      slug: "heritage-pendant-01",
      name: "Crescent Pendant",
      nameAr: "قلادة الهلال",
      story: "A diamond-set crescent moon on a fine gold chain.",
      storyAr: "هلال مرصع بالماس على سلسلة ذهبية رفيعة.",
      material: "21K Gold, Diamond",
      materialAr: "ذهب ٢١ قيراط، ماس",
      weight: 6.4,
      dimensions: "42 cm chain, 2 cm pendant",
      dimensionsAr: "سلسلة ٤٢ سم، قلادة ٢ سم",
      image: "heritage-pendant.jpg",
      basePrice: 32000,
      visibilityGroups: ["collection-gold", "standard", "vip"],
      collectionId: collectionGold.id,
      specifications: [
        {
          key: "Motif",
          keyAr: "الرمز",
          value: "Crescent moon",
          valueAr: "هلال",
          sortOrder: 1,
        },
      ],
    },
    {
      slug: "oasis-ring-01",
      name: "Oasis Duet Ring",
      nameAr: "خاتم الواحة الثنائي",
      story:
        "Intertwined rose and white gold bands around a bezel-set diamond.",
      storyAr: "حلقتان متشابكتان من الذهب الوردي والأبيض حول ماسة مرصعة.",
      material: "18K Rose & White Gold, Diamond",
      materialAr: "ذهب وردي وأبيض ١٨ قيراط، ماس",
      weight: 5.6,
      dimensions: "Ring size 52",
      dimensionsAr: "مقاس الخاتم ٥٢",
      image: "oasis-ring.jpg",
      basePrice: 41000,
      visibilityGroups: ["vip", "collection-oasis"],
      collectionId: collectionOasis.id,
      specifications: [
        {
          key: "Setting",
          keyAr: "الترصيع",
          value: "Bezel",
          valueAr: "إطار كامل",
          sortOrder: 1,
        },
      ],
    },
    {
      slug: "oasis-bracelet-01",
      name: "Oasis Tennis Bracelet",
      nameAr: "سوار الواحة",
      story: "Alternating diamonds and sapphires — a river of light.",
      storyAr: "ماس وياقوت أزرق بالتناوب — نهر من الضوء.",
      material: "18K White Gold, Diamond, Sapphire",
      materialAr: "ذهب أبيض ١٨ قيراط، ماس، ياقوت أزرق",
      weight: 12.8,
      dimensions: "17 cm",
      dimensionsAr: "١٧ سم",
      image: "oasis-bracelet.jpg",
      basePrice: 96000,
      visibilityGroups: ["vip", "collection-oasis"],
      collectionId: collectionOasis.id,
      specifications: [
        {
          key: "Stones",
          keyAr: "الأحجار",
          value: "Diamond & Sapphire",
          valueAr: "ماس وياقوت أزرق",
          sortOrder: 1,
        },
      ],
    },
    {
      slug: "oasis-choker-01",
      name: "Oasis Pearl Choker",
      nameAr: "طوق الواحة باللؤلؤ",
      story: "Pearls and diamonds woven into white gold lace.",
      storyAr: "لآلئ وماس منسوجة في مخرمات من الذهب الأبيض.",
      material: "18K White Gold, Pearl, Diamond",
      materialAr: "ذهب أبيض ١٨ قيراط، لؤلؤ، ماس",
      weight: 48.2,
      dimensions: "36 cm",
      dimensionsAr: "٣٦ سم",
      image: "oasis-choker.jpg",
      basePrice: 145000,
      visibilityGroups: ["vip", "collection-oasis"],
      collectionId: collectionOasis.id,
      specifications: [
        {
          key: "Pearls",
          keyAr: "اللؤلؤ",
          value: "South Sea",
          valueAr: "بحار الجنوب",
          sortOrder: 1,
        },
      ],
    },
  ];

  const designs: Record<string, { id: string }> = {};
  for (const d of designSeeds) {
    const { specifications, image, ...fields } = d;
    const design = await prisma.design.upsert({
      where: { slug: d.slug },
      update: {
        nameAr: d.nameAr,
        storyAr: d.storyAr,
        materialAr: d.materialAr,
        dimensionsAr: d.dimensionsAr,
        imageUrls: [seedImageKey(image)],
      },
      create: {
        ...fields,
        imageUrls: [seedImageKey(image)],
        specifications: { create: specifications },
      },
    });
    designs[d.slug] = design;

    // Backfill bilingual specs for pre-existing designs (create skips this).
    for (const spec of specifications) {
      const existing = await prisma.designSpecification.findFirst({
        where: { designId: design.id, key: spec.key },
      });
      if (existing) {
        await prisma.designSpecification.update({
          where: { id: existing.id },
          data: { keyAr: spec.keyAr, valueAr: spec.valueAr },
        });
      } else {
        await prisma.designSpecification.create({
          data: { designId: design.id, ...spec },
        });
      }
    }
  }

  // --- Pieces ---
  // [serial, design slug, owner (null = available), status override]
  const pieceSeeds: [string, string, { id: string } | null, string?][] = [
    ["DADAN-2026-NR-000001", "noir-ring-01", amira!],
    ["DADAN-2026-NR-000002", "noir-necklace-01", amira!],
    ["DADAN-2026-NR-000003", "noir-necklace-01", null],
    ["DADAN-2026-NR-000004", "noir-earrings-01", null],
    ["DADAN-2026-NR-000005", "noir-ring-01", null],
    ["DADAN-2026-GH-000001", "heritage-bracelet-01", khalid!],
    ["DADAN-2026-GH-000002", "heritage-bracelet-01", null],
    ["DADAN-2026-GH-000003", "heritage-earrings-01", null],
    ["DADAN-2026-GH-000004", "heritage-pendant-01", null],
    ["DADAN-2026-GH-000005", "heritage-pendant-01", null, "RETIRED"],
    ["DADAN-2026-OA-000001", "oasis-ring-01", layla!],
    ["DADAN-2026-OA-000002", "oasis-bracelet-01", null],
    ["DADAN-2026-OA-000003", "oasis-choker-01", null],
    ["DADAN-2026-OA-000004", "oasis-ring-01", null],
  ];

  const pieces: Record<string, { id: string }> = {};
  for (const [serial, designSlug, owner, statusOverride] of pieceSeeds) {
    const status = statusOverride ?? (owner ? "OWNED" : "AVAILABLE");
    const piece = await prisma.piece.upsert({
      where: { serialNumber: serial },
      update: {},
      create: {
        serialNumber: serial,
        designId: designs[designSlug]!.id,
        status: status as never,
        currentOwnerId: owner?.id ?? null,
        registeredAt: new Date(),
      },
    });
    pieces[serial] = piece;

    if (owner) {
      const existingRecord = await prisma.ownershipRecord.findFirst({
        where: { pieceId: piece.id, clientId: owner.id },
      });
      if (!existingRecord) {
        await prisma.ownershipRecord.create({
          data: {
            pieceId: piece.id,
            clientId: owner.id,
            acquisitionType: "PURCHASE",
            notes: "Initial seed ownership",
          },
        });
      }
    }
  }

  // --- Certificates (valid HMAC verify tokens) ---
  const certificateSeeds: [string, string, { id: string }][] = [
    ["CERT-2026-A3F1C09B", "DADAN-2026-NR-000001", amira!],
    ["CERT-2026-B7E2D04A", "DADAN-2026-NR-000002", amira!],
    ["CERT-2026-C1D4E88F", "DADAN-2026-GH-000001", khalid!],
    ["CERT-2026-D9A6F21C", "DADAN-2026-OA-000001", layla!],
  ];

  for (const [certificateNumber, serial, owner] of certificateSeeds) {
    const piece = pieces[serial]!;
    const existing = await prisma.certificate.findUnique({
      where: { certificateNumber },
    });
    if (existing) continue;

    const certificateId = randomUUID();
    const token = createVerificationToken(
      serial,
      certificateId,
      CERT_SIGNING_SECRET,
    );
    await prisma.certificate.create({
      data: {
        id: certificateId,
        pieceId: piece.id,
        ownerId: owner.id,
        certificateNumber,
        isActive: true,
        qrCodeData: `${BASE_URL}/verify?serial=${encodeURIComponent(serial)}&token=${token}`,
        templateVersion: "1.0",
      },
    });
  }

  // --- Orders (purchase history matching the owned pieces) ---
  const orderSeeds: [{ id: string }, string[], string][] = [
    [amira!, ["DADAN-2026-NR-000001", "DADAN-2026-NR-000002"], "FULFILLED"],
    [khalid!, ["DADAN-2026-GH-000001"], "PAID"],
    [layla!, ["DADAN-2026-OA-000001"], "FULFILLED"],
  ];

  for (const [client, serials, status] of orderSeeds) {
    const existing = await prisma.order.findFirst({
      where: { clientId: client.id },
    });
    if (existing) continue;

    const orderDesigns = await prisma.piece.findMany({
      where: { serialNumber: { in: serials } },
      include: { design: true },
    });
    const subtotal = orderDesigns.reduce(
      (sum, p) => sum + Number(p.design.basePrice),
      0,
    );
    const taxRate = 0.15;
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;

    await prisma.order.create({
      data: {
        clientId: client.id,
        status: status as never,
        paymentStatus: status === "CANCELLED" ? "REFUNDED" : "PAID",
        fulfillmentStatus: status === "FULFILLED" ? "DELIVERED" : "UNFULFILLED",
        subtotalAmount: subtotal,
        taxAmount,
        taxRate,
        totalAmount: total,
        currency: "SAR",
        paymentProvider: "mock",
        paymentMethod: "MADA",
        paymentReference: `seed_${serials[0]}`,
        shippingAddress: {
          fullName: "Seed Client",
          line1: "King Fahd Road",
          city: "Riyadh",
          region: "Riyadh",
          country: "SA",
          postalCode: "11564",
          phone: "+966500000000",
        },
        items: {
          create: orderDesigns.map((p) => {
            const price = Number(p.design.basePrice);
            const itemTax = Math.round(price * taxRate * 100) / 100;
            return {
              pieceId: p.id,
              designId: p.designId,
              priceAtPurchase: p.design.basePrice,
              taxRate,
              taxAmount: itemTax,
              lineTotal: Math.round((price + itemTax) * 100) / 100,
              currency: "SAR",
            };
          }),
        },
      },
    });
  }

  // --- Saved pieces ---
  const savedSeeds: [{ id: string }, string][] = [
    [amira!, "DADAN-2026-OA-000003"],
    [amira!, "DADAN-2026-NR-000004"],
    [khalid!, "DADAN-2026-GH-000004"],
    [layla!, "DADAN-2026-OA-000002"],
  ];
  for (const [client, serial] of savedSeeds) {
    await prisma.savedPiece.upsert({
      where: {
        clientId_pieceId: { clientId: client.id, pieceId: pieces[serial]!.id },
      },
      update: {},
      create: { clientId: client.id, pieceId: pieces[serial]!.id },
    });
  }

  // --- Transfers across the workflow ---
  const reviewTransfer = await prisma.transferRequest.findFirst({
    where: {
      pieceId: pieces["DADAN-2026-NR-000001"]!.id,
      status: "DADAN_REVIEW",
    },
  });
  if (!reviewTransfer) {
    await prisma.transferRequest.create({
      data: {
        pieceId: pieces["DADAN-2026-NR-000001"]!.id,
        fromClientId: amira!.id,
        toClientId: khalid!.id,
        transferType: "GIFT",
        status: "DADAN_REVIEW",
        senderConfirmedAt: new Date(),
        recipientConfirmedAt: new Date(),
        initiatedAt: new Date(),
      },
    });
    await prisma.piece.update({
      where: { id: pieces["DADAN-2026-NR-000001"]!.id },
      data: { status: "TRANSFER_PENDING" },
    });
  }

  const initiatedTransfer = await prisma.transferRequest.findFirst({
    where: { pieceId: pieces["DADAN-2026-OA-000001"]!.id, status: "INITIATED" },
  });
  if (!initiatedTransfer) {
    await prisma.transferRequest.create({
      data: {
        pieceId: pieces["DADAN-2026-OA-000001"]!.id,
        fromClientId: layla!.id,
        toClientId: amira!.id,
        transferType: "SALE",
        status: "INITIATED",
        initiatedAt: new Date(),
      },
    });
    await prisma.piece.update({
      where: { id: pieces["DADAN-2026-OA-000001"]!.id },
      data: { status: "TRANSFER_PENDING" },
    });
  }

  console.log("Seed complete.");
  console.log("Test House Keys (plaintext — dev only):");
  for (const c of clientSeeds) {
    console.log(`  ${c.displayName}: ${c.houseKeyPlain}`);
  }
  console.log(
    `Admin logins: admin@dadan.sa / staff@dadan.sa / viewer@dadan.sa (password: ${ADMIN_PASSWORD})`,
  );
  console.log(`Super admin id: ${superAdmin.id}, staff id: ${staffAdmin.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
