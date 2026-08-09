// ---------------------------------------------------------------------------
// DADAN seed dataset — the single source of truth for all application data.
//
// Every collection, product (design), client, and piece below is deterministic:
// re-running the seeder always produces the exact same dataset.
//
// All images come exclusively from the `seeder-assets/` directory.
// ---------------------------------------------------------------------------

export type ClientKey = "amira" | "khalid" | "layla";

export interface SeedSpec {
  key: string;
  keyAr: string;
  value: string;
  valueAr: string;
  sortOrder: number;
}

export interface SeedCollection {
  slug: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  cover: string;
  sortOrder: number;
  visibilityGroups: string[];
}

export interface SeedDesign {
  slug: string;
  name: string;
  nameAr: string;
  collectionSlug: string;
  story: string;
  storyAr: string;
  material: string;
  materialAr: string;
  weight: number;
  dimensions: string;
  dimensionsAr: string;
  images: string[];
  basePrice: number;
  visibilityGroups: string[];
  specifications: SeedSpec[];
}

export interface SeedClient {
  key: ClientKey;
  houseId: string;
  houseKeyPlain: string;
  displayName: string;
  email: string;
  locale: "ar" | "en";
  visibilityGroups: string[];
}

export interface SeedPiece {
  serialNumber: string;
  designSlug: string;
  ownerKey?: ClientKey;
  status?: "AVAILABLE" | "OWNED" | "TRANSFER_PENDING" | "RETIRED";
}

export interface SeedCertificate {
  certificateNumber: string;
  serialNumber: string;
  ownerKey: ClientKey;
}

export interface SeedOrder {
  clientKey: ClientKey;
  pieceSerials: string[];
  status: "PENDING" | "PAID" | "PROCESSING" | "FULFILLED" | "CANCELLED";
}

export interface SeedSavedPiece {
  clientKey: ClientKey;
  serialNumber: string;
}

export interface SeedCartItem {
  clientKey: ClientKey;
  serialNumber: string;
}

export interface SeedTransfer {
  pieceSerialNumber: string;
  fromClientKey: ClientKey;
  toClientKey: ClientKey;
  transferType: "SALE" | "GIFT" | "INHERITANCE";
  status:
    | "INITIATED"
    | "SENDER_CONFIRMED"
    | "RECIPIENT_CONFIRMED"
    | "DADAN_REVIEW"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED";
  senderConfirmed?: boolean;
  recipientConfirmed?: boolean;
}

export const COLLECTIONS: SeedCollection[] = [
  {
    slug: "noir-collection",
    name: "Collection Noir",
    nameAr: "تشكيلة نوار",
    description: "Midnight elegance — black gold and onyx.",
    descriptionAr: "أناقة منتصف الليل — ذهب أسود وعقيق يماني.",
    cover: "collection-1.avif",
    sortOrder: 1,
    visibilityGroups: ["vip", "collection-noir"],
  },
  {
    slug: "gold-heritage",
    name: "Gold Heritage",
    nameAr: "تراث الذهب",
    description: "Traditional Saudi craftsmanship in warm gold.",
    descriptionAr: "حِرفية سعودية أصيلة بذهب دافئ.",
    cover: "collection-2.avif",
    sortOrder: 2,
    visibilityGroups: ["vip", "collection-heritage", "standard"],
  },
  {
    slug: "oasis",
    name: "Oasis",
    nameAr: "الواحة",
    description: "Light, water and stone — a modern desert reverie.",
    descriptionAr: "ضوء وماء وحجر — حلم صحراوي معاصر.",
    cover: "collection-3.avif",
    sortOrder: 3,
    visibilityGroups: ["vip", "collection-oasis"],
  },
  {
    slug: "mawaddah",
    name: "Mawaddah",
    nameAr: "مودّة",
    description: "Pieces that celebrate bonds — gifting, devotion, love.",
    descriptionAr: "قطع تحتفي بالروابط — الهدايا والإخلاص والحب.",
    cover: "collection-4.avif",
    sortOrder: 4,
    visibilityGroups: ["vip", "collection-mawaddah"],
  },
];

export const DESIGNS: SeedDesign[] = [
  // --- Noir (2 designs) ---
  {
    slug: "noir-solitaire-ring",
    name: "Noir Solitaire Ring",
    nameAr: "خاتم نوار سوليتير",
    collectionSlug: "noir-collection",
    story: "A single black diamond set in brushed gold — the signature of Collection Noir.",
    storyAr: "ماسة سوداء واحدة مرصعة في ذهب مصقول — توقيع تشكيلة نوار.",
    material: "18K Gold, Black Diamond",
    materialAr: "ذهب ١٨ قيراط، ماس أسود",
    weight: 4.2,
    dimensions: "Ring size 54",
    dimensionsAr: "مقاس الخاتم ٥٤",
    images: ["product-1.avif", "product-2.avif", "product-3.avif"],
    basePrice: 45000,
    visibilityGroups: ["vip", "collection-noir"],
    specifications: [
      { key: "Stone", keyAr: "الحجر", value: "Black Diamond", valueAr: "ماس أسود", sortOrder: 1 },
      { key: "Carat", keyAr: "القيراط", value: "1.2 ct", valueAr: "١٫٢ قيراط", sortOrder: 2 },
    ],
  },
  {
    slug: "noir-cascade-necklace",
    name: "Noir Cascade Necklace",
    nameAr: "عقد نوار المتدرج",
    collectionSlug: "noir-collection",
    story: "Graduated onyx beads with a gold clasp — movement and shadow.",
    storyAr: "حبات عقيق متدرجة بمشبك ذهبي — حركة وظلال.",
    material: "18K Gold, Onyx",
    materialAr: "ذهب ١٨ قيراط، عقيق يماني",
    weight: 28.5,
    dimensions: "45 cm chain",
    dimensionsAr: "سلسلة ٤٥ سم",
    images: ["product-4.avif", "product-5.avif", "product-23.avif"],
    basePrice: 62000,
    visibilityGroups: ["vip", "collection-noir"],
    specifications: [
      { key: "Stone", keyAr: "الحجر", value: "Onyx", valueAr: "عقيق يماني", sortOrder: 1 },
      { key: "Clasp", keyAr: "المشبك", value: "18K Gold", valueAr: "ذهب ١٨ قيراط", sortOrder: 2 },
    ],
  },
  // --- Heritage (2 designs) ---
  {
    slug: "heritage-cuff-bracelet",
    name: "Heritage Cuff Bracelet",
    nameAr: "سوار التراث",
    collectionSlug: "gold-heritage",
    story: "Hand-engraved Arabic calligraphy on a solid gold cuff.",
    storyAr: "خط عربي محفور يدويًا على سوار من الذهب الخالص.",
    material: "22K Gold",
    materialAr: "ذهب ٢٢ قيراط",
    weight: 35.0,
    dimensions: "6.5 cm diameter",
    dimensionsAr: "قطر ٦٫٥ سم",
    images: ["product-6.avif", "product-7.avif", "product-8.avif"],
    basePrice: 78000,
    visibilityGroups: ["vip", "collection-heritage", "standard"],
    specifications: [
      { key: "Engraving", keyAr: "النقش", value: "Hand-engraved calligraphy", valueAr: "خط عربي محفور يدويًا", sortOrder: 1 },
    ],
  },
  {
    slug: "heritage-drop-earrings",
    name: "Heritage Drop Earrings",
    nameAr: "أقراط التراث المتدلية",
    collectionSlug: "gold-heritage",
    story: "Pear-shaped emeralds suspended from gold filigree.",
    storyAr: "زمرد على شكل كمثرى متدلٍّ من زخارف ذهبية دقيقة.",
    material: "18K Gold, Emerald",
    materialAr: "ذهب ١٨ قيراط، زمرد",
    weight: 8.3,
    dimensions: "3.2 cm drop",
    dimensionsAr: "تدلٍّ ٣٫٢ سم",
    images: ["product-9.avif", "product-10.avif"],
    basePrice: 55000,
    visibilityGroups: ["collection-heritage", "standard"],
    specifications: [
      { key: "Stone", keyAr: "الحجر", value: "Emerald", valueAr: "زمرد", sortOrder: 1 },
      { key: "Cut", keyAr: "القطع", value: "Pear", valueAr: "كمثرى", sortOrder: 2 },
    ],
  },
  // --- Oasis (2 designs) ---
  {
    slug: "oasis-duet-ring",
    name: "Oasis Duet Ring",
    nameAr: "خاتم الواحة الثنائي",
    collectionSlug: "oasis",
    story: "Intertwined rose and white gold bands around a bezel-set diamond.",
    storyAr: "حلقتان متشابكتان من الذهب الوردي والأبيض حول ماسة مرصعة.",
    material: "18K Rose & White Gold, Diamond",
    materialAr: "ذهب وردي وأبيض ١٨ قيراط، ماس",
    weight: 5.6,
    dimensions: "Ring size 52",
    dimensionsAr: "مقاس الخاتم ٥٢",
    images: ["product-11.avif", "product-12.avif", "product-13.avif"],
    basePrice: 41000,
    visibilityGroups: ["vip", "collection-oasis"],
    specifications: [
      { key: "Setting", keyAr: "الترصيع", value: "Bezel", valueAr: "إطار كامل", sortOrder: 1 },
    ],
  },
  {
    slug: "oasis-pearl-choker",
    name: "Oasis Pearl Choker",
    nameAr: "طوق الواحة باللؤلؤ",
    collectionSlug: "oasis",
    story: "Pearls and diamonds woven into white gold lace.",
    storyAr: "لآلئ وماس منسوجة في مخرمات من الذهب الأبيض.",
    material: "18K White Gold, Pearl, Diamond",
    materialAr: "ذهب أبيض ١٨ قيراط، لؤلؤ، ماس",
    weight: 48.2,
    dimensions: "36 cm",
    dimensionsAr: "٣٦ سم",
    images: ["product-14.avif", "product-15.avif", "product-16.avif"],
    basePrice: 145000,
    visibilityGroups: ["vip", "collection-oasis"],
    specifications: [
      { key: "Pearls", keyAr: "اللؤلؤ", value: "South Sea", valueAr: "بحار الجنوب", sortOrder: 1 },
    ],
  },
  // --- Mawaddah (2 designs) ---
  {
    slug: "mawaddah-eternity-band",
    name: "Mawaddah Eternity Band",
    nameAr: "خاتم مودّة الأبدي",
    collectionSlug: "mawaddah",
    story: "An unbroken circle of channel-set diamonds — devotion without end.",
    storyAr: "دائرة غير منقطعة من الماس المرصع بالقناة — إخلاص بلا نهاية.",
    material: "18K Rose Gold, Diamond",
    materialAr: "ذهب وردي ١٨ قيراط، ماس",
    weight: 3.8,
    dimensions: "Ring size 50",
    dimensionsAr: "مقاس الخاتم ٥٠",
    images: ["product-17.avif", "product-18.avif", "product-19.avif"],
    basePrice: 36000,
    visibilityGroups: ["vip", "collection-mawaddah"],
    specifications: [
      { key: "Setting", keyAr: "الترصيع", value: "Channel", valueAr: "قناة", sortOrder: 1 },
      { key: "Stones", keyAr: "الأحجار", value: "24 round diamonds", valueAr: "٢٤ ماسة مستديرة", sortOrder: 2 },
    ],
  },
  {
    slug: "mawaddah-pendant-heart",
    name: "Mawaddah Heart Pendant",
    nameAr: "قلادة مودّة القلب",
    collectionSlug: "mawaddah",
    story: "A pavé diamond heart on a delicate gold chain — the ultimate token of affection.",
    storyAr: "قلب مرصع بالماس على سلسلة ذهبية رقيقة — أسمى رموز المودّة.",
    material: "18K Gold, Diamond",
    materialAr: "ذهب ١٨ قيراط، ماس",
    weight: 5.1,
    dimensions: "42 cm chain, 1.8 cm pendant",
    dimensionsAr: "سلسلة ٤٢ سم، قلادة ١٫٨ سم",
    images: ["product-20.avif", "product-21.avif", "product-22.avif"],
    basePrice: 28000,
    visibilityGroups: ["vip", "collection-mawaddah"],
    specifications: [
      { key: "Motif", keyAr: "الرمز", value: "Heart", valueAr: "قلب", sortOrder: 1 },
    ],
  },
];

// Every asset filename referenced by the catalog. Only these files are ever
// uploaded to storage — nothing else may remain after a seed.
export const ALL_REFERENCED_ASSETS: string[] = [
  ...new Set([
    ...COLLECTIONS.map((c) => c.cover),
    ...DESIGNS.flatMap((d) => d.images),
  ]),
];

export const CLIENTS: SeedClient[] = [
  {
    key: "amira",
    houseId: "AMR2K9",
    houseKeyPlain: "dadan-vip-key-001",
    displayName: "أميرة الراشد",
    email: "amira@example.com",
    locale: "ar",
    visibilityGroups: ["vip", "collection-noir", "collection-oasis", "collection-mawaddah", "riyadh"],
  },
  {
    key: "khalid",
    houseId: "KHL3M7",
    houseKeyPlain: "dadan-key-002",
    displayName: "خالد الفارسي",
    email: "khalid@example.com",
    locale: "ar",
    visibilityGroups: ["standard", "collection-heritage", "riyadh"],
  },
  {
    key: "layla",
    houseId: "LYL4N8",
    houseKeyPlain: "dadan-key-003",
    displayName: "Layla Al-Mutairi",
    email: "layla@example.com",
    locale: "en",
    visibilityGroups: ["vip", "collection-heritage", "collection-oasis"],
  },
];

export const PIECES: SeedPiece[] = [
  // Noir
  { serialNumber: "DADAN-2026-NC-000001", designSlug: "noir-solitaire-ring", ownerKey: "amira" },
  { serialNumber: "DADAN-2026-NC-000002", designSlug: "noir-solitaire-ring" },
  { serialNumber: "DADAN-2026-NC-000003", designSlug: "noir-cascade-necklace" },
  { serialNumber: "DADAN-2026-NC-000004", designSlug: "noir-cascade-necklace" },
  // Heritage
  { serialNumber: "DADAN-2026-GH-000001", designSlug: "heritage-cuff-bracelet", ownerKey: "khalid" },
  { serialNumber: "DADAN-2026-GH-000002", designSlug: "heritage-cuff-bracelet" },
  { serialNumber: "DADAN-2026-GH-000003", designSlug: "heritage-drop-earrings" },
  { serialNumber: "DADAN-2026-GH-000004", designSlug: "heritage-drop-earrings" },
  // Oasis
  { serialNumber: "DADAN-2026-OA-000001", designSlug: "oasis-duet-ring", ownerKey: "layla" },
  { serialNumber: "DADAN-2026-OA-000002", designSlug: "oasis-duet-ring" },
  { serialNumber: "DADAN-2026-OA-000003", designSlug: "oasis-pearl-choker" },
  { serialNumber: "DADAN-2026-OA-000004", designSlug: "oasis-pearl-choker" },
  // Mawaddah
  { serialNumber: "DADAN-2026-MA-000001", designSlug: "mawaddah-eternity-band", ownerKey: "amira" },
  { serialNumber: "DADAN-2026-MA-000002", designSlug: "mawaddah-eternity-band" },
  { serialNumber: "DADAN-2026-MA-000003", designSlug: "mawaddah-pendant-heart" },
  { serialNumber: "DADAN-2026-MA-000004", designSlug: "mawaddah-pendant-heart" },
];

export const CERTIFICATES: SeedCertificate[] = [
  { certificateNumber: "CERT-2026-A3F1C09B", serialNumber: "DADAN-2026-NC-000001", ownerKey: "amira" },
  { certificateNumber: "CERT-2026-B7E2D04A", serialNumber: "DADAN-2026-GH-000001", ownerKey: "khalid" },
  { certificateNumber: "CERT-2026-C1D4E88F", serialNumber: "DADAN-2026-OA-000001", ownerKey: "layla" },
  { certificateNumber: "CERT-2026-D9A6F21C", serialNumber: "DADAN-2026-MA-000001", ownerKey: "amira" },
];

export const ORDERS: SeedOrder[] = [
  { clientKey: "amira", pieceSerials: ["DADAN-2026-NC-000001", "DADAN-2026-MA-000001"], status: "FULFILLED" },
  { clientKey: "khalid", pieceSerials: ["DADAN-2026-GH-000001"], status: "PAID" },
  { clientKey: "layla", pieceSerials: ["DADAN-2026-OA-000001"], status: "FULFILLED" },
];

export const SAVED_PIECES: SeedSavedPiece[] = [
  { clientKey: "amira", serialNumber: "DADAN-2026-OA-000003" },
  { clientKey: "amira", serialNumber: "DADAN-2026-GH-000002" },
  { clientKey: "khalid", serialNumber: "DADAN-2026-MA-000004" },
  { clientKey: "khalid", serialNumber: "DADAN-2026-NC-000004" },
  { clientKey: "layla", serialNumber: "DADAN-2026-NC-000002" },
  { clientKey: "layla", serialNumber: "DADAN-2026-GH-000004" },
];

export const CART_ITEMS: SeedCartItem[] = [
  { clientKey: "amira", serialNumber: "DADAN-2026-OA-000004" },
];

export const TRANSFERS: SeedTransfer[] = [
  {
    pieceSerialNumber: "DADAN-2026-NC-000001",
    fromClientKey: "amira",
    toClientKey: "khalid",
    transferType: "GIFT",
    status: "DADAN_REVIEW",
    senderConfirmed: true,
    recipientConfirmed: true,
  },
];
