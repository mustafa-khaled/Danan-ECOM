export function pickLocalized(
  locale: "ar" | "en",
  en: string,
  ar: string | null | undefined,
): string;
export function pickLocalized(
  locale: "ar" | "en",
  en: string | null,
  ar: string | null | undefined,
): string | null;
export function pickLocalized(
  locale: "ar" | "en",
  en: string | null,
  ar: string | null | undefined,
): string | null {
  if (locale === "ar" && ar) return ar;
  return en;
}
