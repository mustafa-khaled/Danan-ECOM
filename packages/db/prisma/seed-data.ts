// ---------------------------------------------------------------------------
// DADAN seed dataset — the single source of truth for all application data.
//
// Every collection, catalog template, client, and piece below is deterministic:
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
  classSlugs: string[];
}

export interface SeedCatalogTemplate {
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
  price: number;
  specifications: SeedSpec[];
}

export interface SeedClient {
  key: ClientKey;
  houseId: string;
  houseKeyPlain: string;
  displayName: string;
  email: string;
  locale: "ar" | "en";
  classSlug: string;
}

export interface SeedPiece {
  serialNumber: string;
  templateSlug: string;
  ownerKey?: ClientKey;
  status?: "AVAILABLE" | "OWNED" | "TRANSFER_PENDING" | "RETIRED";
}

export interface SeedClass {
  slug: string;
  name: string;
  nameAr: string;
  description: string;
  sortOrder: number;
  isDefault?: boolean;
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
  // --- Original four ---
  {
    slug: "noir-collection",
    name: "Collection Noir",
    nameAr: "تشكيلة نوار",
    description: "Midnight elegance — black gold and onyx.",
    descriptionAr: "أناقة منتصف الليل — ذهب أسود وعقيق يماني.",
    cover: "collection-1.avif",
    sortOrder: 1,
    classSlugs: ["class-a"],
  },
  {
    slug: "gold-heritage",
    name: "Gold Heritage",
    nameAr: "تراث الذهب",
    description: "Traditional Saudi craftsmanship in warm gold.",
    descriptionAr: "حِرفية سعودية أصيلة بذهب دافئ.",
    cover: "collection-2.avif",
    sortOrder: 2,
    classSlugs: ["class-a", "class-b", "class-c"],
  },
  {
    slug: "oasis",
    name: "Oasis",
    nameAr: "الواحة",
    description: "Light, water and stone — a modern desert reverie.",
    descriptionAr: "ضوء وماء وحجر — حلم صحراوي معاصر.",
    cover: "collection-3.avif",
    sortOrder: 3,
    classSlugs: ["class-a", "class-b"],
  },
  {
    slug: "mawaddah",
    name: "Mawaddah",
    nameAr: "مودّة",
    description: "Pieces that celebrate bonds — gifting, devotion, love.",
    descriptionAr: "قطع تحتفي بالروابط — الهدايا والإخلاص والحب.",
    cover: "collection-4.avif",
    sortOrder: 4,
    classSlugs: ["class-a"],
  },
  // --- Four new collections ---
  {
    slug: "al-nour",
    name: "Al-Nour",
    nameAr: "النور",
    description: "Radiant forms inspired by light breaking through carved stone.",
    descriptionAr: "أشكال مضيئة مستوحاة من الضوء يخترق الحجر المنحوت.",
    cover: "collection-1.avif",
    sortOrder: 5,
    classSlugs: ["class-a"],
  },
  {
    slug: "zenith",
    name: "Zenith",
    nameAr: "الذروة",
    description: "Pieces that mark the highest point — rare, elevated, exact.",
    descriptionAr: "قطع تُعلي من القمة — نادرة، راقية، دقيقة.",
    cover: "collection-2.avif",
    sortOrder: 6,
    classSlugs: ["class-a", "class-b"],
  },
  {
    slug: "desert-rose",
    name: "Desert Rose",
    nameAr: "وردة الصحراء",
    description: "The crystalline beauty of the desert — raw yet refined.",
    descriptionAr: "جمال الصحراء الكريستالي — خام في أصله، مصقول في صياغته.",
    cover: "collection-3.avif",
    sortOrder: 7,
    classSlugs: ["class-a", "class-b", "class-c"],
  },
  {
    slug: "oud",
    name: "Oud",
    nameAr: "العود",
    description: "Deep resonance in precious metal — layered, warm, enduring.",
    descriptionAr: "رنين عميق في المعدن الثمين — متعدد الطبقات، دافئ، دائم.",
    cover: "collection-4.avif",
    sortOrder: 8,
    classSlugs: ["class-a"],
  },
];

export const CLASSES: SeedClass[] = [
  {
    slug: "class-a",
    name: "Class A",
    nameAr: "الفئة أ",
    description: "Full House Access",
    sortOrder: 1,
  },
  {
    slug: "class-b",
    name: "Class B",
    nameAr: "الفئة ب",
    description: "Curated House Access",
    sortOrder: 2,
  },
  {
    slug: "class-c",
    name: "Class C",
    nameAr: "الفئة ج",
    description: "Standard House Access",
    sortOrder: 3,
    isDefault: true,
  },
];

export const CATALOG_TEMPLATES: SeedCatalogTemplate[] = [
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
    price: 45000,
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
    price: 62000,
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
    price: 78000,
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
    price: 55000,
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
    price: 41000,
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
    price: 145000,
    specifications: [
      { key: "Pearls", keyAr: "اللؤلؤ", value: "South Sea", valueAr: "بحار الجنوب", sortOrder: 1 },
    ],
  },
  // --- Mawaddah (2 original + 1 new = 3 designs) ---
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
    price: 36000,
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
    price: 28000,
    specifications: [
      { key: "Motif", keyAr: "الرمز", value: "Heart", valueAr: "قلب", sortOrder: 1 },
    ],
  },
  {
    slug: "mawaddah-link-bracelet",
    name: "Mawaddah Link Bracelet",
    nameAr: "سوار مودّة المتصل",
    collectionSlug: "mawaddah",
    story: "Interlocking gold links — a bond that holds across time.",
    storyAr: "حلقات ذهبية متشابكة — رابطة تصمد عبر الزمن.",
    material: "18K Gold",
    materialAr: "ذهب ١٨ قيراط",
    weight: 18.0,
    dimensions: "19 cm length",
    dimensionsAr: "طول ١٩ سم",
    images: ["product-21.avif", "product-22.avif"],
    price: 32000,
    specifications: [
      { key: "Links", keyAr: "الحلقات", value: "36 interlocking", valueAr: "٣٦ حلقة متشابكة", sortOrder: 1 },
    ],
  },

  // --- Noir (2 original + 1 new = 3 designs) ---
  // (existing noir templates already above; new one here)
  {
    slug: "noir-geometric-pendant",
    name: "Noir Geometric Pendant",
    nameAr: "قلادة نوار الهندسية",
    collectionSlug: "noir-collection",
    story: "A sharp-edged black diamond rhombus suspended on a gold wire — geometry meeting night.",
    storyAr: "معين من الماس الأسود ذو حواف حادة معلق على خيط ذهبي — الهندسة تلتقي الليل.",
    material: "18K Gold, Black Diamond",
    materialAr: "ذهب ١٨ قيراط، ماس أسود",
    weight: 6.8,
    dimensions: "40 cm chain, 2 cm pendant",
    dimensionsAr: "سلسلة ٤٠ سم، قلادة ٢ سم",
    images: ["product-2.avif", "product-3.avif"],
    price: 38000,
    specifications: [
      { key: "Shape", keyAr: "الشكل", value: "Rhombus", valueAr: "معين", sortOrder: 1 },
    ],
  },

  // --- Heritage (2 original + 1 new = 3 designs) ---
  {
    slug: "heritage-filigree-ring",
    name: "Heritage Filigree Ring",
    nameAr: "خاتم التراث بالزخرفة الدقيقة",
    collectionSlug: "gold-heritage",
    story: "Intricate gold filigree work forming a delicate lace-like band.",
    storyAr: "زخرفة ذهبية دقيقة تشكّل حزامًا يشبه الدانتيل.",
    material: "22K Gold",
    materialAr: "ذهب ٢٢ قيراط",
    weight: 6.4,
    dimensions: "Ring size 56",
    dimensionsAr: "مقاس الخاتم ٥٦",
    images: ["product-7.avif", "product-8.avif"],
    price: 52000,
    specifications: [
      { key: "Technique", keyAr: "الأسلوب", value: "Filigree", valueAr: "زخرفة دقيقة", sortOrder: 1 },
    ],
  },

  // --- Oasis (2 original + 1 new = 3 designs) ---
  {
    slug: "oasis-sand-bangle",
    name: "Oasis Sand Bangle",
    nameAr: "سوار الواحة الرملي",
    collectionSlug: "oasis",
    story: "A smooth white gold bangle with a brushed sand-grain texture.",
    storyAr: "سوار من الذهب الأبيض الناعم بنسيج حبيبات الرمل المصقولة.",
    material: "18K White Gold",
    materialAr: "ذهب أبيض ١٨ قيراط",
    weight: 22.5,
    dimensions: "6.2 cm inner diameter",
    dimensionsAr: "قطر داخلي ٦٫٢ سم",
    images: ["product-12.avif", "product-13.avif"],
    price: 47000,
    specifications: [
      { key: "Finish", keyAr: "التشطيب", value: "Brushed", valueAr: "مصقول بالفرشاة", sortOrder: 1 },
    ],
  },

  // =====================================================================
  // --- Al-Nour (3 designs) ---
  // =====================================================================
  {
    slug: "al-nour-crescent-ring",
    name: "Al-Nour Crescent Ring",
    nameAr: "خاتم النور الهلالي",
    collectionSlug: "al-nour",
    story: "A crescent of white diamonds set in yellow gold — light made wearable.",
    storyAr: "هلال من الماس الأبيض مرصع في الذهب الأصفر — الضوء يُلبَس.",
    material: "18K Yellow Gold, Diamond",
    materialAr: "ذهب أصفر ١٨ قيراط، ماس",
    weight: 4.5,
    dimensions: "Ring size 54",
    dimensionsAr: "مقاس الخاتم ٥٤",
    images: ["product-1.avif", "product-2.avif"],
    price: 39000,
    specifications: [
      { key: "Setting", keyAr: "الترصيع", value: "Pavé", valueAr: "بافيه", sortOrder: 1 },
    ],
  },
  {
    slug: "al-nour-star-pendant",
    name: "Al-Nour Star Pendant",
    nameAr: "قلادة النور النجمية",
    collectionSlug: "al-nour",
    story: "An eight-pointed star pendant — a symbol of guidance and illumination.",
    storyAr: "قلادة نجمة ثمانية الرؤوس — رمز الإرشاد والإضاءة.",
    material: "18K Gold, White Sapphire",
    materialAr: "ذهب ١٨ قيراط، ياقوت أبيض",
    weight: 7.2,
    dimensions: "40 cm chain, 2.2 cm pendant",
    dimensionsAr: "سلسلة ٤٠ سم، قلادة ٢٫٢ سم",
    images: ["product-3.avif", "product-4.avif"],
    price: 44000,
    specifications: [
      { key: "Points", keyAr: "الرؤوس", value: "8", valueAr: "٨", sortOrder: 1 },
    ],
  },
  {
    slug: "al-nour-arc-bracelet",
    name: "Al-Nour Arc Bracelet",
    nameAr: "سوار النور المقوّس",
    collectionSlug: "al-nour",
    story: "Arched gold panels reflecting light from every angle.",
    storyAr: "ألواح ذهبية مقوّسة تعكس الضوء من كل زاوية.",
    material: "18K Gold",
    materialAr: "ذهب ١٨ قيراط",
    weight: 24.0,
    dimensions: "18 cm length",
    dimensionsAr: "طول ١٨ سم",
    images: ["product-5.avif", "product-6.avif"],
    price: 61000,
    specifications: [
      { key: "Panels", keyAr: "الألواح", value: "12 arched", valueAr: "١٢ لوحة مقوّسة", sortOrder: 1 },
    ],
  },

  // =====================================================================
  // --- Zenith (3 designs) ---
  // =====================================================================
  {
    slug: "zenith-summit-ring",
    name: "Zenith Summit Ring",
    nameAr: "خاتم الذروة القمة",
    collectionSlug: "zenith",
    story: "A princess-cut diamond elevated on a high cathedral setting — reaching its zenith.",
    storyAr: "ماسة ذات قطع الأميرة مرفوعة على إعداد كاتدرائي — تبلغ ذروتها.",
    material: "18K White Gold, Diamond",
    materialAr: "ذهب أبيض ١٨ قيراط، ماس",
    weight: 5.3,
    dimensions: "Ring size 52",
    dimensionsAr: "مقاس الخاتم ٥٢",
    images: ["product-7.avif", "product-8.avif"],
    price: 58000,
    specifications: [
      { key: "Cut", keyAr: "القطع", value: "Princess", valueAr: "أميرة", sortOrder: 1 },
      { key: "Setting", keyAr: "الترصيع", value: "Cathedral", valueAr: "كاتدرائي", sortOrder: 2 },
    ],
  },
  {
    slug: "zenith-peak-earrings",
    name: "Zenith Peak Earrings",
    nameAr: "أقراط الذروة المدببة",
    collectionSlug: "zenith",
    story: "Tapered gold spikes tipped with blue sapphires — sharp precision.",
    storyAr: "مسامير ذهبية مدببة مرصعة بالياقوت الأزرق — دقة حادة.",
    material: "18K Gold, Blue Sapphire",
    materialAr: "ذهب ١٨ قيراط، ياقوت أزرق",
    weight: 9.1,
    dimensions: "3.5 cm drop",
    dimensionsAr: "تدلٍّ ٣٫٥ سم",
    images: ["product-9.avif", "product-10.avif"],
    price: 49000,
    specifications: [
      { key: "Stone", keyAr: "الحجر", value: "Blue Sapphire", valueAr: "ياقوت أزرق", sortOrder: 1 },
    ],
  },
  {
    slug: "zenith-apex-necklace",
    name: "Zenith Apex Necklace",
    nameAr: "عقد الذروة القمة",
    collectionSlug: "zenith",
    story: "A collar necklace rising to a diamond apex — architecture you wear.",
    storyAr: "عقد طوق يرتفع نحو قمة ماسية — هندسة معمارية ترتديها.",
    material: "18K White Gold, Diamond",
    materialAr: "ذهب أبيض ١٨ قيراط، ماس",
    weight: 42.0,
    dimensions: "38 cm",
    dimensionsAr: "٣٨ سم",
    images: ["product-11.avif", "product-12.avif"],
    price: 130000,
    specifications: [
      { key: "Diamonds", keyAr: "الماس", value: "18 round-cut", valueAr: "١٨ قطعة مستديرة", sortOrder: 1 },
    ],
  },

  // =====================================================================
  // --- Desert Rose (3 designs) ---
  // =====================================================================
  {
    slug: "desert-rose-bloom-ring",
    name: "Desert Rose Bloom Ring",
    nameAr: "خاتم وردة الصحراء المتفتحة",
    collectionSlug: "desert-rose",
    story: "Pink tourmaline petals set in rose gold — nature blooming on the hand.",
    storyAr: "بتلات من التورمالين الوردي مرصعة في الذهب الوردي — الطبيعة تتفتح على اليد.",
    material: "18K Rose Gold, Pink Tourmaline",
    materialAr: "ذهب وردي ١٨ قيراط، تورمالين وردي",
    weight: 6.0,
    dimensions: "Ring size 54",
    dimensionsAr: "مقاس الخاتم ٥٤",
    images: ["product-13.avif", "product-14.avif"],
    price: 33000,
    specifications: [
      { key: "Stone", keyAr: "الحجر", value: "Pink Tourmaline", valueAr: "تورمالين وردي", sortOrder: 1 },
    ],
  },
  {
    slug: "desert-rose-sand-choker",
    name: "Desert Rose Sand Choker",
    nameAr: "طوق وردة الصحراء الرملي",
    collectionSlug: "desert-rose",
    story: "Rose gold grains fused into a fluid choker — the desert's textures elevated.",
    storyAr: "حبيبات ذهب وردي مدمجة في طوق سائل — ملامس الصحراء مُسامات.",
    material: "18K Rose Gold",
    materialAr: "ذهب وردي ١٨ قيراط",
    weight: 38.0,
    dimensions: "36 cm",
    dimensionsAr: "٣٦ سم",
    images: ["product-15.avif", "product-16.avif"],
    price: 72000,
    specifications: [
      { key: "Technique", keyAr: "الأسلوب", value: "Granulation", valueAr: "تحبيب", sortOrder: 1 },
    ],
  },
  {
    slug: "desert-rose-dune-bracelet",
    name: "Desert Rose Dune Bracelet",
    nameAr: "سوار وردة الصحراء الكثيبي",
    collectionSlug: "desert-rose",
    story: "Wavy gold bands echoing sand dune ridges — beauty born from movement.",
    storyAr: "حزم ذهبية متموجة تُردد صدى قمم الكثبان الرملية — جمال يولد من الحركة.",
    material: "18K Rose Gold, Diamond",
    materialAr: "ذهب وردي ١٨ قيراط، ماس",
    weight: 20.5,
    dimensions: "19 cm length",
    dimensionsAr: "طول ١٩ سم",
    images: ["product-17.avif", "product-18.avif"],
    price: 55000,
    specifications: [
      { key: "Waves", keyAr: "الأمواج", value: "3 layers", valueAr: "٣ طبقات", sortOrder: 1 },
    ],
  },

  // =====================================================================
  // --- Oud (3 designs) ---
  // =====================================================================
  {
    slug: "oud-resonance-pendant",
    name: "Oud Resonance Pendant",
    nameAr: "قلادة العود الرنانة",
    collectionSlug: "oud",
    story: "A teardrop amber encased in gold — warmth that echoes like the oud.",
    storyAr: "قطرة كهرمان محاطة بالذهب — دفء يتردد مثل صوت العود.",
    material: "18K Gold, Amber",
    materialAr: "ذهب ١٨ قيراط، كهرمان",
    weight: 9.5,
    dimensions: "42 cm chain, 3 cm pendant",
    dimensionsAr: "سلسلة ٤٢ سم، قلادة ٣ سم",
    images: ["product-19.avif", "product-20.avif"],
    price: 29000,
    specifications: [
      { key: "Stone", keyAr: "الحجر", value: "Amber", valueAr: "كهرمان", sortOrder: 1 },
    ],
  },
  {
    slug: "oud-harmony-ring",
    name: "Oud Harmony Ring",
    nameAr: "خاتم العود المتناغم",
    collectionSlug: "oud",
    story: "Two interlocking bands — one yellow, one rose gold — playing in perfect harmony.",
    storyAr: "حلقتان متشابكتان — واحدة صفراء وأخرى وردية — تتناغمان بشكل مثالي.",
    material: "18K Yellow & Rose Gold",
    materialAr: "ذهب أصفر ووردي ١٨ قيراط",
    weight: 7.0,
    dimensions: "Ring size 56",
    dimensionsAr: "مقاس الخاتم ٥٦",
    images: ["product-21.avif", "product-22.avif"],
    price: 34000,
    specifications: [
      { key: "Bands", keyAr: "الحزم", value: "2 interlocking", valueAr: "٢ متشابكتان", sortOrder: 1 },
    ],
  },
  {
    slug: "oud-echo-earrings",
    name: "Oud Echo Earrings",
    nameAr: "أقراط العود الصدوية",
    collectionSlug: "oud",
    story: "Textured gold discs that capture and scatter light — an echo of deep, warm tones.",
    storyAr: "أقراص ذهبية ذات نسيج تلتقط الضوء وتبعثره — صدى نغمات دافئة عميقة.",
    material: "18K Gold",
    materialAr: "ذهب ١٨ قيراط",
    weight: 11.0,
    dimensions: "2.5 cm diameter",
    dimensionsAr: "قطر ٢٫٥ سم",
    images: ["product-23.avif", "product-1.avif"],
    price: 26000,
    specifications: [
      { key: "Finish", keyAr: "التشطيب", value: "Hammered", valueAr: "مطروق", sortOrder: 1 },
    ],
  },
];

// Every asset filename referenced by the catalog. Only these files are ever
// uploaded to storage — nothing else may remain after a seed.
export const ALL_REFERENCED_ASSETS: string[] = [
  ...new Set([
    ...COLLECTIONS.map((c) => c.cover),
    ...CATALOG_TEMPLATES.flatMap((d) => d.images),
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
    classSlug: "class-a",
  },
  {
    key: "khalid",
    houseId: "KHL3M7",
    houseKeyPlain: "dadan-key-002",
    displayName: "خالد الفارسي",
    email: "khalid@example.com",
    locale: "ar",
    classSlug: "class-c",
  },
  {
    key: "layla",
    houseId: "LYL4N8",
    houseKeyPlain: "dadan-key-003",
    displayName: "Layla Al-Mutairi",
    email: "layla@example.com",
    locale: "en",
    classSlug: "class-b",
  },
];

export const PIECES: SeedPiece[] = [
  // --- Noir (6 pieces across 3 templates) ---
  { serialNumber: "DADAN-2026-NC-000001", templateSlug: "noir-solitaire-ring", ownerKey: "amira" },
  { serialNumber: "DADAN-2026-NC-000002", templateSlug: "noir-solitaire-ring" },
  { serialNumber: "DADAN-2026-NC-000003", templateSlug: "noir-cascade-necklace" },
  { serialNumber: "DADAN-2026-NC-000004", templateSlug: "noir-cascade-necklace" },
  { serialNumber: "DADAN-2026-NC-000005", templateSlug: "noir-geometric-pendant" },
  { serialNumber: "DADAN-2026-NC-000006", templateSlug: "noir-geometric-pendant" },
  // --- Heritage (6 pieces across 3 templates) ---
  { serialNumber: "DADAN-2026-GH-000001", templateSlug: "heritage-cuff-bracelet", ownerKey: "khalid" },
  { serialNumber: "DADAN-2026-GH-000002", templateSlug: "heritage-cuff-bracelet" },
  { serialNumber: "DADAN-2026-GH-000003", templateSlug: "heritage-drop-earrings" },
  { serialNumber: "DADAN-2026-GH-000004", templateSlug: "heritage-drop-earrings" },
  { serialNumber: "DADAN-2026-GH-000005", templateSlug: "heritage-filigree-ring" },
  { serialNumber: "DADAN-2026-GH-000006", templateSlug: "heritage-filigree-ring" },
  // --- Oasis (6 pieces across 3 templates) ---
  { serialNumber: "DADAN-2026-OA-000001", templateSlug: "oasis-duet-ring", ownerKey: "layla" },
  { serialNumber: "DADAN-2026-OA-000002", templateSlug: "oasis-duet-ring" },
  { serialNumber: "DADAN-2026-OA-000003", templateSlug: "oasis-pearl-choker" },
  { serialNumber: "DADAN-2026-OA-000004", templateSlug: "oasis-pearl-choker" },
  { serialNumber: "DADAN-2026-OA-000005", templateSlug: "oasis-sand-bangle" },
  { serialNumber: "DADAN-2026-OA-000006", templateSlug: "oasis-sand-bangle" },
  // --- Mawaddah (6 pieces across 3 templates) ---
  { serialNumber: "DADAN-2026-MA-000001", templateSlug: "mawaddah-eternity-band", ownerKey: "amira" },
  { serialNumber: "DADAN-2026-MA-000002", templateSlug: "mawaddah-eternity-band" },
  { serialNumber: "DADAN-2026-MA-000003", templateSlug: "mawaddah-pendant-heart" },
  { serialNumber: "DADAN-2026-MA-000004", templateSlug: "mawaddah-pendant-heart" },
  { serialNumber: "DADAN-2026-MA-000005", templateSlug: "mawaddah-link-bracelet" },
  { serialNumber: "DADAN-2026-MA-000006", templateSlug: "mawaddah-link-bracelet" },
  // --- Al-Nour (6 pieces across 3 templates) ---
  { serialNumber: "DADAN-2026-AN-000001", templateSlug: "al-nour-crescent-ring", ownerKey: "amira" },
  { serialNumber: "DADAN-2026-AN-000002", templateSlug: "al-nour-crescent-ring" },
  { serialNumber: "DADAN-2026-AN-000003", templateSlug: "al-nour-star-pendant" },
  { serialNumber: "DADAN-2026-AN-000004", templateSlug: "al-nour-star-pendant" },
  { serialNumber: "DADAN-2026-AN-000005", templateSlug: "al-nour-arc-bracelet" },
  { serialNumber: "DADAN-2026-AN-000006", templateSlug: "al-nour-arc-bracelet" },
  // --- Zenith (6 pieces across 3 templates) ---
  { serialNumber: "DADAN-2026-ZN-000001", templateSlug: "zenith-summit-ring", ownerKey: "layla" },
  { serialNumber: "DADAN-2026-ZN-000002", templateSlug: "zenith-summit-ring" },
  { serialNumber: "DADAN-2026-ZN-000003", templateSlug: "zenith-peak-earrings", ownerKey: "layla" },
  { serialNumber: "DADAN-2026-ZN-000004", templateSlug: "zenith-peak-earrings" },
  { serialNumber: "DADAN-2026-ZN-000005", templateSlug: "zenith-apex-necklace" },
  { serialNumber: "DADAN-2026-ZN-000006", templateSlug: "zenith-apex-necklace" },
  // --- Desert Rose (6 pieces across 3 templates) ---
  { serialNumber: "DADAN-2026-DR-000001", templateSlug: "desert-rose-bloom-ring", ownerKey: "khalid" },
  { serialNumber: "DADAN-2026-DR-000002", templateSlug: "desert-rose-bloom-ring" },
  { serialNumber: "DADAN-2026-DR-000003", templateSlug: "desert-rose-sand-choker", ownerKey: "khalid" },
  { serialNumber: "DADAN-2026-DR-000004", templateSlug: "desert-rose-sand-choker" },
  { serialNumber: "DADAN-2026-DR-000005", templateSlug: "desert-rose-dune-bracelet" },
  { serialNumber: "DADAN-2026-DR-000006", templateSlug: "desert-rose-dune-bracelet" },
  // --- Oud (6 pieces across 3 templates) ---
  { serialNumber: "DADAN-2026-OU-000001", templateSlug: "oud-resonance-pendant" },
  { serialNumber: "DADAN-2026-OU-000002", templateSlug: "oud-resonance-pendant" },
  { serialNumber: "DADAN-2026-OU-000003", templateSlug: "oud-harmony-ring" },
  { serialNumber: "DADAN-2026-OU-000004", templateSlug: "oud-harmony-ring" },
  { serialNumber: "DADAN-2026-OU-000005", templateSlug: "oud-echo-earrings" },
  { serialNumber: "DADAN-2026-OU-000006", templateSlug: "oud-echo-earrings" },
];

export const CERTIFICATES: SeedCertificate[] = [
  // Original 4
  { certificateNumber: "CERT-2026-A3F1C09B", serialNumber: "DADAN-2026-NC-000001", ownerKey: "amira" },
  { certificateNumber: "CERT-2026-B7E2D04A", serialNumber: "DADAN-2026-GH-000001", ownerKey: "khalid" },
  { certificateNumber: "CERT-2026-C1D4E88F", serialNumber: "DADAN-2026-OA-000001", ownerKey: "layla" },
  { certificateNumber: "CERT-2026-D9A6F21C", serialNumber: "DADAN-2026-MA-000001", ownerKey: "amira" },
  // New 5 — one per newly owned piece
  { certificateNumber: "CERT-2026-E2B8H33D", serialNumber: "DADAN-2026-AN-000001", ownerKey: "amira" },
  { certificateNumber: "CERT-2026-F5C9I44E", serialNumber: "DADAN-2026-ZN-000001", ownerKey: "layla" },
  { certificateNumber: "CERT-2026-G6D0J55F", serialNumber: "DADAN-2026-ZN-000003", ownerKey: "layla" },
  { certificateNumber: "CERT-2026-H7E1K66G", serialNumber: "DADAN-2026-DR-000001", ownerKey: "khalid" },
  { certificateNumber: "CERT-2026-I8F2L77H", serialNumber: "DADAN-2026-DR-000003", ownerKey: "khalid" },
];

export const ORDERS: SeedOrder[] = [
  // Original 3
  { clientKey: "amira",  pieceSerials: ["DADAN-2026-NC-000001", "DADAN-2026-MA-000001"], status: "FULFILLED" },
  { clientKey: "khalid", pieceSerials: ["DADAN-2026-GH-000001"], status: "PAID" },
  { clientKey: "layla",  pieceSerials: ["DADAN-2026-OA-000001"], status: "FULFILLED" },
  // New 3 — one per ownership batch
  { clientKey: "amira",  pieceSerials: ["DADAN-2026-AN-000001"], status: "FULFILLED" },
  { clientKey: "layla",  pieceSerials: ["DADAN-2026-ZN-000001", "DADAN-2026-ZN-000003"], status: "FULFILLED" },
  { clientKey: "khalid", pieceSerials: ["DADAN-2026-DR-000001", "DADAN-2026-DR-000003"], status: "PAID" },
];

export const SAVED_PIECES: SeedSavedPiece[] = [
  // Original
  { clientKey: "amira",  serialNumber: "DADAN-2026-OA-000003" },
  { clientKey: "amira",  serialNumber: "DADAN-2026-GH-000002" },
  { clientKey: "khalid", serialNumber: "DADAN-2026-MA-000004" },
  { clientKey: "khalid", serialNumber: "DADAN-2026-NC-000004" },
  { clientKey: "layla",  serialNumber: "DADAN-2026-NC-000002" },
  { clientKey: "layla",  serialNumber: "DADAN-2026-GH-000004" },
  // New — coverage across new collections
  { clientKey: "amira",  serialNumber: "DADAN-2026-ZN-000005" },
  { clientKey: "khalid", serialNumber: "DADAN-2026-OU-000003" },
  { clientKey: "layla",  serialNumber: "DADAN-2026-AN-000005" },
];

export const CART_ITEMS: SeedCartItem[] = [
  // Original
  { clientKey: "amira",  serialNumber: "DADAN-2026-OA-000004" },
  // New
  { clientKey: "khalid", serialNumber: "DADAN-2026-OU-000001" },
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
