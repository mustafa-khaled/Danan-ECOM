import { ArabicShaper } from "arabic-persian-reshaper";

// Arabic letters incl. presentation forms; excludes Arabic-Indic digits,
// which are written left-to-right even inside RTL text.
const RTL_LETTER =
  /[\u0621-\u064A\u066E-\u06D3\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function containsArabic(text: string): boolean {
  return RTL_LETTER.test(text);
}

/**
 * Prepares Arabic text for pdf-lib, which has no bidi/shaping engine:
 * 1. Contextual shaping (presentation forms) via arabic-persian-reshaper.
 * 2. Manual RTL visual reordering: word order is reversed and characters
 *    inside Arabic words are reversed, while digit/Latin words keep their
 *    left-to-right character order.
 */
export function shapeArabicForPdf(text: string): string {
  const shaped = ArabicShaper.convertArabic(text);

  return shaped
    .split(" ")
    .reverse()
    .map((word) =>
      RTL_LETTER.test(word) ? [...word].reverse().join("") : word,
    )
    .join(" ");
}
