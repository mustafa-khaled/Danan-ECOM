import { describe, expect, it } from "vitest";
import { formatPrice } from "./format";

describe("formatPrice", () => {
  it("formats SAR in English locale", () => {
    const result = formatPrice(7800, "SAR", "en");
    expect(result).toContain("7,800");
    expect(result).toMatch(/SAR|ر\.س/);
  });

  it("formats SAR in Arabic locale", () => {
    const result = formatPrice(7800, "SAR", "ar");
    expect(result).toBeTruthy();
  });
});
