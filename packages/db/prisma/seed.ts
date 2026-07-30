import { randomUUID } from "node:crypto";
import { PrismaClient } from "../generated/client";
import * as bcrypt from "bcrypt";
import { createVerificationToken } from "@dadan/utils";
import { seedAssets, seedImageKey } from "./seed-assets";

const prisma = new PrismaClient();

const isReset = process.argv.includes("--reset");
const envFlag = process.argv.find((a) => a.startsWith("--environment="));
const targetEnv = envFlag?.split("=")[1] ?? process.env.NODE_ENV;

if (
  targetEnv === "production" &&
  process.env.SEED_ALLOW_PRODUCTION !== "true"
) {
  console.error(
    "Refusing to seed: environment=production. Set SEED_ALLOW_PRODUCTION=true to override.",
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

const counts = {
  admins: { created: 0, updated: 0 },
  clients: { created: 0, updated: 0 },
  collections: { created: 0, updated: 0 },
  designs: { created: 0, updated: 0 },
  pieces: { created: 0, updated: 0 },
  certificates: { created: 0, skipped: 0 },
  orders: { created: 0, skipped: 0 },
  savedPieces: { created: 0, updated: 0 },
  transfers: { created: 0, skipped: 0 },
};

async function upsertAndCount<T extends { id: string }>(
  result: T,
  counter: { created: number; updated: number },
  isNew: boolean,
): Promise<T> {
  if (isNew) counter.created++;
  else counter.updated++;
  return result;
}

async function main() {
  console.log(`\nSeeding DADAN Dijital database (env=${targetEnv ?? "development"})...\n`);

  if (isReset) {
    console.log("--reset flag detected: clearing existing seed data...");
    await prisma.$transaction([
      prisma.cartItem.deleteMany(),
      prisma.savedPiece.deleteMany(),
      prisma.verificationLog.deleteMany(),
      prisma.transferRequest.deleteMany(),
      prisma.orderItem.deleteMany(),
      prisma.order.deleteMany(),
      prisma.certificate.deleteMany(),
      prisma.ownershipRecord.deleteMany(),
      prisma.piece.deleteMany(),
      prisma.designSpecification.deleteMany(),
      prisma.design.deleteMany(),
      prisma.collection.deleteMany(),
      prisma.client.deleteMany(),
      prisma.adminUser.deleteMany(),
      prisma.auditLog.deleteMany(),
      prisma.failedRefund.deleteMany(),
    ]);
    console.log("  Cleared all seed-related tables.\n");
  }

  const assetResult = await seedAssets();
  console.log(
    `  Assets: ${assetResult.uploaded} uploaded, ${assetResult.skipped} skipped, ${assetResult.missing} missing\n`,
  );

  // --- Admin users ---
  const adminPassword = await hashPassword(ADMIN_PASSWORD);

  const adminSeeds = [
    { email: "admin@dadan.sa", displayName: "DADAN Super Admin", role: "SUPER_ADMIN" as const },
    { email: "staff@dadan.sa", displayName: "DADAN Staff", role: "STAFF" as const },
    { email: "viewer@dadan.sa", displayName: "DADAN Viewer", role: "VIEWER" as const },
  ];

  const admins: Array<{ id: string; email: string }> = [];
  for (const a of adminSeeds) {
    const existing = await prisma.adminUser.findUnique({ where: { email: a.email } });
    const admin = await prisma.adminUser.upsert({
      where: { email: a.email },
      update: { passwordHash: adminPassword },
      create: { email: a.email, passwordHash: adminPassword, displayName: a.displayName, role: a.role },
    });
    await upsertAndCount(admin, counts.admins, !existing);
    admins.push(admin);
  }
  const [superAdmin, staffAdmin] = admins;

  // --- Clients ---
  const clientSeeds = [
    {
      houseKeyPlain: process.env.SEED_HOUSE_KEY_1 ?? "dadan-vip-key-001",
      displayName: "أميرة الراشد",
      email: "amira@example.com",
      locale: "ar",
      visibilityGroups: ["vip", "collection-noir", "collection-oasis", "collection-mawaddah", "riyadh"],
    },
    {
      houseKeyPlain: process.env.SEED_HOUSE_KEY_2 ?? "dadan-key-002",
      displayName: "خالد الفارسي",
      email: "khalid@example.com",
      locale: "ar",
      visibilityGroups: ["standard", "collection-heritage", "collection-sahara", "riyadh"],
    },
    {
      houseKeyPlain: process.env.SEED_HOUSE_KEY_3 ?? "dadan-key-003",
      displayName: "Layla Al-Mutairi",
      email: "layla@example.com",
      locale: "en",
      visibilityGroups: ["vip", "collection-heritage", "collection-oasis", "collection-celestial"],
    },
  ];

  const clients: Array<{ id: string }> = [];
  for (const c of clientSeeds) {
    const existing = await prisma.client.findUnique({ where: { email: c.email } });
    const hashed = existing ? existing.houseKey : await hashHouseKey(c.houseKeyPlain);
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
    await upsertAndCount(client, counts.clients, !existing);
    clients.push(client);
  }

  const [amira, khalid, layla] = clients;

  // --- Collections (6 collections, each with a W-prefixed cover image) ---
  interface CollectionSeed {
    slug: string;
    name: string;
    nameAr: string;
    description: string;
    descriptionAr: string;
    coverImage: string;
    sortOrder: number;
    visibilityGroups: string[];
  }

  const collectionSeeds: CollectionSeed[] = [
    {
      slug: "noir-collection",
      name: "Collection Noir",
      nameAr: "تشكيلة نوار",
      description: "Midnight elegance — black gold and onyx.",
      descriptionAr: "أناقة منتصف الليل — ذهب أسود وعقيق يماني.",
      coverImage: "W24.png",
      sortOrder: 1,
      visibilityGroups: ["vip", "collection-noir"],
    },
    {
      slug: "gold-heritage",
      name: "Gold Heritage",
      nameAr: "تراث الذهب",
      description: "Traditional Saudi craftsmanship in warm gold.",
      descriptionAr: "حِرفية سعودية أصيلة بذهب دافئ.",
      coverImage: "W25.png",
      sortOrder: 2,
      visibilityGroups: ["vip", "collection-heritage", "standard"],
    },
    {
      slug: "oasis",
      name: "Oasis",
      nameAr: "الواحة",
      description: "Light, water and stone — a modern desert reverie.",
      descriptionAr: "ضوء وماء وحجر — حلم صحراوي معاصر.",
      coverImage: "W26.png",
      sortOrder: 3,
      visibilityGroups: ["vip", "collection-oasis"],
    },
    {
      slug: "mawaddah",
      name: "Mawaddah",
      nameAr: "مودّة",
      description: "Pieces that celebrate bonds — gifting, devotion, love.",
      descriptionAr: "قطع تحتفي بالروابط — الهدايا والإخلاص والحب.",
      coverImage: "W27.png",
      sortOrder: 4,
      visibilityGroups: ["vip", "collection-mawaddah"],
    },
    {
      slug: "sahara",
      name: "Sahara",
      nameAr: "صحراء",
      description: "Raw desert textures rendered in precious metals.",
      descriptionAr: "ملامس الصحراء الخام مصاغة من معادن ثمينة.",
      coverImage: "W28.png",
      sortOrder: 5,
      visibilityGroups: ["collection-sahara", "standard"],
    },
    {
      slug: "celestial",
      name: "Celestial",
      nameAr: "سماوي",
      description: "Stars, crescents, and cosmic geometry in fine gold.",
      descriptionAr: "نجوم وأهلّة وهندسة كونية من الذهب الرفيع.",
      coverImage: "W29.png",
      sortOrder: 6,
      visibilityGroups: ["vip", "collection-celestial"],
    },
  ];

  const collections: Record<string, { id: string }> = {};
  for (const c of collectionSeeds) {
    const existing = await prisma.collection.findUnique({ where: { slug: c.slug } });
    const collection = await prisma.collection.upsert({
      where: { slug: c.slug },
      update: {
        nameAr: c.nameAr,
        descriptionAr: c.descriptionAr,
        coverImageUrl: seedImageKey(c.coverImage),
      },
      create: {
        name: c.name,
        nameAr: c.nameAr,
        slug: c.slug,
        description: c.description,
        descriptionAr: c.descriptionAr,
        coverImageUrl: seedImageKey(c.coverImage),
        isVisible: true,
        sortOrder: c.sortOrder,
        visibilityGroups: c.visibilityGroups,
      },
    });
    await upsertAndCount(collection, counts.collections, !existing);
    collections[c.slug] = collection;
  }

  // --- Designs (11 designs, ~2 per collection, each with a W-prefixed product image) ---
  const designSeeds: (DesignSeed & { collectionSlug: string })[] = [
    // Noir (2 designs)
    {
      slug: "noir-solitaire-ring",
      name: "Noir Solitaire Ring",
      nameAr: "خاتم نوار سوليتير",
      story: "A single black diamond set in brushed gold — the signature of Collection Noir.",
      storyAr: "ماسة سوداء واحدة مرصعة في ذهب مصقول — توقيع تشكيلة نوار.",
      material: "18K Gold, Black Diamond",
      materialAr: "ذهب ١٨ قيراط، ماس أسود",
      weight: 4.2,
      dimensions: "Ring size 54",
      dimensionsAr: "مقاس الخاتم ٥٤",
      image: "W7.png",
      basePrice: 45000,
      visibilityGroups: ["vip", "collection-noir"],
      collectionSlug: "noir-collection",
      specifications: [
        { key: "Stone", keyAr: "الحجر", value: "Black Diamond", valueAr: "ماس أسود", sortOrder: 1 },
        { key: "Carat", keyAr: "القيراط", value: "1.2 ct", valueAr: "١٫٢ قيراط", sortOrder: 2 },
      ],
    },
    {
      slug: "noir-cascade-necklace",
      name: "Noir Cascade Necklace",
      nameAr: "عقد نوار المتدرج",
      story: "Graduated onyx beads with a gold clasp — movement and shadow.",
      storyAr: "حبات عقيق متدرجة بمشبك ذهبي — حركة وظلال.",
      material: "18K Gold, Onyx",
      materialAr: "ذهب ١٨ قيراط، عقيق يماني",
      weight: 28.5,
      dimensions: "45 cm chain",
      dimensionsAr: "سلسلة ٤٥ سم",
      image: "W8.png",
      basePrice: 62000,
      visibilityGroups: ["vip", "collection-noir"],
      collectionSlug: "noir-collection",
      specifications: [
        { key: "Stone", keyAr: "الحجر", value: "Onyx", valueAr: "عقيق يماني", sortOrder: 1 },
        { key: "Clasp", keyAr: "المشبك", value: "18K Gold", valueAr: "ذهب ١٨ قيراط", sortOrder: 2 },
      ],
    },
    // Heritage (2 designs)
    {
      slug: "heritage-cuff-bracelet",
      name: "Heritage Cuff Bracelet",
      nameAr: "سوار التراث",
      story: "Hand-engraved Arabic calligraphy on a solid gold cuff.",
      storyAr: "خط عربي محفور يدويًا على سوار من الذهب الخالص.",
      material: "22K Gold",
      materialAr: "ذهب ٢٢ قيراط",
      weight: 35.0,
      dimensions: "6.5 cm diameter",
      dimensionsAr: "قطر ٦٫٥ سم",
      image: "W9.png",
      basePrice: 78000,
      visibilityGroups: ["vip", "collection-heritage", "standard"],
      collectionSlug: "gold-heritage",
      specifications: [
        { key: "Engraving", keyAr: "النقش", value: "Hand-engraved calligraphy", valueAr: "خط عربي محفور يدويًا", sortOrder: 1 },
      ],
    },
    {
      slug: "heritage-drop-earrings",
      name: "Heritage Drop Earrings",
      nameAr: "أقراط التراث المتدلية",
      story: "Pear-shaped emeralds suspended from gold filigree.",
      storyAr: "زمرد على شكل كمثرى متدلٍّ من زخارف ذهبية دقيقة.",
      material: "18K Gold, Emerald",
      materialAr: "ذهب ١٨ قيراط، زمرد",
      weight: 8.3,
      dimensions: "3.2 cm drop",
      dimensionsAr: "تدلٍّ ٣٫٢ سم",
      image: "W10.png",
      basePrice: 55000,
      visibilityGroups: ["collection-heritage", "standard"],
      collectionSlug: "gold-heritage",
      specifications: [
        { key: "Stone", keyAr: "الحجر", value: "Emerald", valueAr: "زمرد", sortOrder: 1 },
        { key: "Cut", keyAr: "القطع", value: "Pear", valueAr: "كمثرى", sortOrder: 2 },
      ],
    },
    // Oasis (2 designs)
    {
      slug: "oasis-duet-ring",
      name: "Oasis Duet Ring",
      nameAr: "خاتم الواحة الثنائي",
      story: "Intertwined rose and white gold bands around a bezel-set diamond.",
      storyAr: "حلقتان متشابكتان من الذهب الوردي والأبيض حول ماسة مرصعة.",
      material: "18K Rose & White Gold, Diamond",
      materialAr: "ذهب وردي وأبيض ١٨ قيراط، ماس",
      weight: 5.6,
      dimensions: "Ring size 52",
      dimensionsAr: "مقاس الخاتم ٥٢",
      image: "W12.png",
      basePrice: 41000,
      visibilityGroups: ["vip", "collection-oasis"],
      collectionSlug: "oasis",
      specifications: [
        { key: "Setting", keyAr: "الترصيع", value: "Bezel", valueAr: "إطار كامل", sortOrder: 1 },
      ],
    },
    {
      slug: "oasis-pearl-choker",
      name: "Oasis Pearl Choker",
      nameAr: "طوق الواحة باللؤلؤ",
      story: "Pearls and diamonds woven into white gold lace.",
      storyAr: "لآلئ وماس منسوجة في مخرمات من الذهب الأبيض.",
      material: "18K White Gold, Pearl, Diamond",
      materialAr: "ذهب أبيض ١٨ قيراط، لؤلؤ، ماس",
      weight: 48.2,
      dimensions: "36 cm",
      dimensionsAr: "٣٦ سم",
      image: "W13.png",
      basePrice: 145000,
      visibilityGroups: ["vip", "collection-oasis"],
      collectionSlug: "oasis",
      specifications: [
        { key: "Pearls", keyAr: "اللؤلؤ", value: "South Sea", valueAr: "بحار الجنوب", sortOrder: 1 },
      ],
    },
    // Mawaddah (2 designs)
    {
      slug: "mawaddah-eternity-band",
      name: "Mawaddah Eternity Band",
      nameAr: "خاتم مودّة الأبدي",
      story: "An unbroken circle of channel-set diamonds — devotion without end.",
      storyAr: "دائرة غير منقطعة من الماس المرصع بالقناة — إخلاص بلا نهاية.",
      material: "18K Rose Gold, Diamond",
      materialAr: "ذهب وردي ١٨ قيراط، ماس",
      weight: 3.8,
      dimensions: "Ring size 50",
      dimensionsAr: "مقاس الخاتم ٥٠",
      image: "W14.png",
      basePrice: 36000,
      visibilityGroups: ["vip", "collection-mawaddah"],
      collectionSlug: "mawaddah",
      specifications: [
        { key: "Setting", keyAr: "الترصيع", value: "Channel", valueAr: "قناة", sortOrder: 1 },
        { key: "Stones", keyAr: "الأحجار", value: "24 round diamonds", valueAr: "٢٤ ماسة مستديرة", sortOrder: 2 },
      ],
    },
    {
      slug: "mawaddah-pendant-heart",
      name: "Mawaddah Heart Pendant",
      nameAr: "قلادة مودّة القلب",
      story: "A pavé diamond heart on a delicate gold chain — the ultimate token of affection.",
      storyAr: "قلب مرصع بالماس على سلسلة ذهبية رقيقة — أسمى رموز المودّة.",
      material: "18K Gold, Diamond",
      materialAr: "ذهب ١٨ قيراط، ماس",
      weight: 5.1,
      dimensions: "42 cm chain, 1.8 cm pendant",
      dimensionsAr: "سلسلة ٤٢ سم، قلادة ١٫٨ سم",
      image: "W15.png",
      basePrice: 28000,
      visibilityGroups: ["vip", "collection-mawaddah"],
      collectionSlug: "mawaddah",
      specifications: [
        { key: "Motif", keyAr: "الرمز", value: "Heart", valueAr: "قلب", sortOrder: 1 },
      ],
    },
    // Sahara (2 designs)
    {
      slug: "sahara-dune-cuff",
      name: "Sahara Dune Cuff",
      nameAr: "سوار كثبان الصحراء",
      story: "Textured gold that mirrors wind-sculpted dunes — raw luxury from the desert.",
      storyAr: "ذهب بملمس يحاكي الكثبان المنحوتة بالرياح — ترف خام من الصحراء.",
      material: "21K Gold",
      materialAr: "ذهب ٢١ قيراط",
      weight: 42.0,
      dimensions: "6.8 cm diameter",
      dimensionsAr: "قطر ٦٫٨ سم",
      image: "W16.png",
      basePrice: 89000,
      visibilityGroups: ["collection-sahara", "standard"],
      collectionSlug: "sahara",
      specifications: [
        { key: "Finish", keyAr: "التشطيب", value: "Sand-blasted texture", valueAr: "ملمس رملي", sortOrder: 1 },
      ],
    },
    {
      slug: "sahara-mirage-ring",
      name: "Sahara Mirage Ring",
      nameAr: "خاتم سراب الصحراء",
      story: "A shifting opal set in hammered gold — an illusion captured in metal.",
      storyAr: "أوبال متلألئ مرصع في ذهب مطرقي — سراب أُسر في المعدن.",
      material: "18K Gold, Opal",
      materialAr: "ذهب ١٨ قيراط، أوبال",
      weight: 6.7,
      dimensions: "Ring size 56",
      dimensionsAr: "مقاس الخاتم ٥٦",
      image: "W17.png",
      basePrice: 52000,
      visibilityGroups: ["collection-sahara", "standard"],
      collectionSlug: "sahara",
      specifications: [
        { key: "Stone", keyAr: "الحجر", value: "Fire Opal", valueAr: "أوبال ناري", sortOrder: 1 },
      ],
    },
    // Celestial (1 design)
    {
      slug: "celestial-crescent-pendant",
      name: "Celestial Crescent Pendant",
      nameAr: "قلادة الهلال السماوي",
      story: "A diamond-set crescent moon suspended between stars — the night sky distilled.",
      storyAr: "هلال مرصع بالماس معلّق بين النجوم — سماء الليل مقطّرة.",
      material: "21K Gold, Diamond",
      materialAr: "ذهب ٢١ قيراط، ماس",
      weight: 6.4,
      dimensions: "42 cm chain, 2 cm pendant",
      dimensionsAr: "سلسلة ٤٢ سم، قلادة ٢ سم",
      image: "W18.png",
      basePrice: 32000,
      visibilityGroups: ["vip", "collection-celestial"],
      collectionSlug: "celestial",
      specifications: [
        { key: "Motif", keyAr: "الرمز", value: "Crescent & Stars", valueAr: "هلال ونجوم", sortOrder: 1 },
        { key: "Diamonds", keyAr: "الماس", value: "0.8 ct total", valueAr: "٠٫٨ قيراط إجمالي", sortOrder: 2 },
      ],
    },
  ];

  const designs: Record<string, { id: string }> = {};
  for (const d of designSeeds) {
    const { specifications, image, collectionSlug, ...fields } = d;
    const collectionId = collections[collectionSlug]!.id;
    const existing = await prisma.design.findUnique({ where: { slug: d.slug } });

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
        collectionId,
        imageUrls: [seedImageKey(image)],
        specifications: { create: specifications },
      },
    });
    await upsertAndCount(design, counts.designs, !existing);
    designs[d.slug] = design;

    for (const spec of specifications) {
      const existingSpec = await prisma.designSpecification.findFirst({
        where: { designId: design.id, key: spec.key },
      });
      if (existingSpec) {
        await prisma.designSpecification.update({
          where: { id: existingSpec.id },
          data: { keyAr: spec.keyAr, valueAr: spec.valueAr },
        });
      } else if (existing) {
        await prisma.designSpecification.create({
          data: { designId: design.id, ...spec },
        });
      }
    }
  }

  // --- Pieces (2 per design = 22 pieces) ---
  const pieceSeeds: [string, string, { id: string } | null, string?][] = [
    // Noir
    ["DADAN-2026-NC-000001", "noir-solitaire-ring", amira!],
    ["DADAN-2026-NC-000002", "noir-solitaire-ring", null],
    ["DADAN-2026-NC-000003", "noir-cascade-necklace", amira!],
    ["DADAN-2026-NC-000004", "noir-cascade-necklace", null],
    // Heritage
    ["DADAN-2026-GH-000001", "heritage-cuff-bracelet", khalid!],
    ["DADAN-2026-GH-000002", "heritage-cuff-bracelet", null],
    ["DADAN-2026-GH-000003", "heritage-drop-earrings", null],
    ["DADAN-2026-GH-000004", "heritage-drop-earrings", null, "RETIRED"],
    // Oasis
    ["DADAN-2026-OA-000001", "oasis-duet-ring", layla!],
    ["DADAN-2026-OA-000002", "oasis-duet-ring", null],
    ["DADAN-2026-OA-000003", "oasis-pearl-choker", null],
    ["DADAN-2026-OA-000004", "oasis-pearl-choker", null],
    // Mawaddah
    ["DADAN-2026-MA-000001", "mawaddah-eternity-band", amira!],
    ["DADAN-2026-MA-000002", "mawaddah-eternity-band", null],
    ["DADAN-2026-MA-000003", "mawaddah-pendant-heart", null],
    ["DADAN-2026-MA-000004", "mawaddah-pendant-heart", null],
    // Sahara
    ["DADAN-2026-SA-000001", "sahara-dune-cuff", khalid!],
    ["DADAN-2026-SA-000002", "sahara-dune-cuff", null],
    ["DADAN-2026-SA-000003", "sahara-mirage-ring", null],
    ["DADAN-2026-SA-000004", "sahara-mirage-ring", null],
    // Celestial
    ["DADAN-2026-CE-000001", "celestial-crescent-pendant", layla!],
    ["DADAN-2026-CE-000002", "celestial-crescent-pendant", null],
  ];

  const pieces: Record<string, { id: string }> = {};
  for (const [serial, designSlug, owner, statusOverride] of pieceSeeds) {
    const status = statusOverride ?? (owner ? "OWNED" : "AVAILABLE");
    const existing = await prisma.piece.findUnique({ where: { serialNumber: serial } });
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
    await upsertAndCount(piece, counts.pieces, !existing);
    pieces[serial] = piece;

    if (owner && !existing) {
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

  // --- Certificates ---
  const certificateSeeds: [string, string, { id: string }][] = [
    ["CERT-2026-A3F1C09B", "DADAN-2026-NC-000001", amira!],
    ["CERT-2026-B7E2D04A", "DADAN-2026-NC-000003", amira!],
    ["CERT-2026-C1D4E88F", "DADAN-2026-GH-000001", khalid!],
    ["CERT-2026-D9A6F21C", "DADAN-2026-OA-000001", layla!],
    ["CERT-2026-E5B3A72D", "DADAN-2026-MA-000001", amira!],
    ["CERT-2026-F8C6D91E", "DADAN-2026-SA-000001", khalid!],
    ["CERT-2026-17A4B83F", "DADAN-2026-CE-000001", layla!],
  ];

  for (const [certificateNumber, serial, owner] of certificateSeeds) {
    const piece = pieces[serial]!;
    const existing = await prisma.certificate.findUnique({ where: { certificateNumber } });
    if (existing) {
      counts.certificates.skipped++;
      continue;
    }

    const certificateId = randomUUID();
    const token = createVerificationToken(serial, certificateId, CERT_SIGNING_SECRET);
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
    counts.certificates.created++;
  }

  // --- Orders ---
  const orderSeeds: [{ id: string }, string[], string][] = [
    [amira!, ["DADAN-2026-NC-000001", "DADAN-2026-NC-000003"], "FULFILLED"],
    [khalid!, ["DADAN-2026-GH-000001"], "PAID"],
    [layla!, ["DADAN-2026-OA-000001", "DADAN-2026-CE-000001"], "FULFILLED"],
    [amira!, ["DADAN-2026-MA-000001"], "FULFILLED"],
    [khalid!, ["DADAN-2026-SA-000001"], "PAID"],
  ];

  for (const [client, serials, status] of orderSeeds) {
    const existing = await prisma.order.findFirst({
      where: {
        clientId: client.id,
        items: { some: { piece: { serialNumber: serials[0] } } },
      },
    });
    if (existing) {
      counts.orders.skipped++;
      continue;
    }

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
    counts.orders.created++;
  }

  // --- Saved pieces ---
  const savedSeeds: [{ id: string }, string][] = [
    [amira!, "DADAN-2026-OA-000003"],
    [amira!, "DADAN-2026-SA-000003"],
    [khalid!, "DADAN-2026-MA-000003"],
    [khalid!, "DADAN-2026-CE-000002"],
    [layla!, "DADAN-2026-NC-000002"],
    [layla!, "DADAN-2026-MA-000004"],
  ];
  for (const [client, serial] of savedSeeds) {
    const existing = await prisma.savedPiece.findUnique({
      where: { clientId_pieceId: { clientId: client.id, pieceId: pieces[serial]!.id } },
    });
    await prisma.savedPiece.upsert({
      where: {
        clientId_pieceId: { clientId: client.id, pieceId: pieces[serial]!.id },
      },
      update: {},
      create: { clientId: client.id, pieceId: pieces[serial]!.id },
    });
    await upsertAndCount(
      { id: `${client.id}_${pieces[serial]!.id}` },
      counts.savedPieces,
      !existing,
    );
  }

  // --- Transfers ---
  const reviewTransfer = await prisma.transferRequest.findFirst({
    where: {
      pieceId: pieces["DADAN-2026-NC-000001"]!.id,
      status: "DADAN_REVIEW",
    },
  });
  if (!reviewTransfer) {
    await prisma.transferRequest.create({
      data: {
        pieceId: pieces["DADAN-2026-NC-000001"]!.id,
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
      where: { id: pieces["DADAN-2026-NC-000001"]!.id },
      data: { status: "TRANSFER_PENDING" },
    });
    counts.transfers.created++;
  } else {
    counts.transfers.skipped++;
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
    counts.transfers.created++;
  } else {
    counts.transfers.skipped++;
  }

  // --- Summary ---
  console.log("\n=== Seed Summary ===");
  console.log(`  Admins:       ${counts.admins.created} created, ${counts.admins.updated} updated`);
  console.log(`  Clients:      ${counts.clients.created} created, ${counts.clients.updated} updated`);
  console.log(`  Collections:  ${counts.collections.created} created, ${counts.collections.updated} updated`);
  console.log(`  Designs:      ${counts.designs.created} created, ${counts.designs.updated} updated`);
  console.log(`  Pieces:       ${counts.pieces.created} created, ${counts.pieces.updated} updated`);
  console.log(`  Certificates: ${counts.certificates.created} created, ${counts.certificates.skipped} skipped`);
  console.log(`  Orders:       ${counts.orders.created} created, ${counts.orders.skipped} skipped`);
  console.log(`  Saved Pieces: ${counts.savedPieces.created} created, ${counts.savedPieces.updated} updated`);
  console.log(`  Transfers:    ${counts.transfers.created} created, ${counts.transfers.skipped} skipped`);
  console.log("");
  console.log("Test House Keys (plaintext — dev only):");
  for (const c of clientSeeds) {
    console.log(`  ${c.displayName}: ${c.houseKeyPlain}`);
  }
  console.log(
    `Admin logins: admin@dadan.sa / staff@dadan.sa / viewer@dadan.sa (password: ${ADMIN_PASSWORD})`,
  );
  console.log(`Super admin id: ${superAdmin!.id}, staff id: ${staffAdmin!.id}`);
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
