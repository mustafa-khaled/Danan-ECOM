import type { Locale } from "@dadan/types";

/** Returns the Arabic variant when requested and present, else the English base value. */
export function pickLocalized(
  locale: Locale,
  en: string,
  ar: string | null | undefined,
): string;
export function pickLocalized(
  locale: Locale,
  en: string | null,
  ar: string | null | undefined,
): string | null;
export function pickLocalized(
  locale: Locale,
  en: string | null,
  ar: string | null | undefined,
): string | null {
  if (locale === "ar" && ar) return ar;
  return en;
}

interface CollectionI18nFields {
  name: string;
  nameAr: string | null;
  description: string | null;
  descriptionAr: string | null;
}

interface PieceI18nFields {
  name: string;
  nameAr: string | null;
  story: string;
  storyAr: string | null;
  material: string;
  materialAr: string | null;
  dimensions: string;
  dimensionsAr: string | null;
}

interface SpecificationI18nFields {
  key: string;
  keyAr: string | null;
  value: string;
  valueAr: string | null;
}

/**
 * Collapses bilingual collection fields to the requested locale and strips
 * the raw *Ar columns from the response.
 */
export function localizeCollection<T extends CollectionI18nFields>(
  collection: T,
  locale: Locale,
): Omit<T, "nameAr" | "descriptionAr"> {
  const { nameAr, descriptionAr, ...rest } = collection;
  return {
    ...rest,
    name: pickLocalized(locale, collection.name, nameAr),
    description: pickLocalized(locale, collection.description, descriptionAr),
  };
}

/**
 * Collapses bilingual piece catalog fields to the requested locale and strips
 * the raw *Ar columns from the response.
 */
export function localizePiece<T extends PieceI18nFields>(
  piece: T,
  locale: Locale,
): Omit<T, "nameAr" | "storyAr" | "materialAr" | "dimensionsAr"> {
  const { nameAr, storyAr, materialAr, dimensionsAr, ...rest } = piece;
  return {
    ...rest,
    name: pickLocalized(locale, piece.name, nameAr),
    story: pickLocalized(locale, piece.story, storyAr),
    material: pickLocalized(locale, piece.material, materialAr),
    dimensions: pickLocalized(locale, piece.dimensions, dimensionsAr),
  };
}

/** Collapses bilingual specification rows to the requested locale. */
export function localizeSpecifications<T extends SpecificationI18nFields>(
  specifications: T[],
  locale: Locale,
): Omit<T, "keyAr" | "valueAr">[] {
  return specifications.map((spec) => {
    const { keyAr, valueAr, ...rest } = spec;
    return {
      ...rest,
      key: pickLocalized(locale, spec.key, keyAr),
      value: pickLocalized(locale, spec.value, valueAr),
    };
  });
}
