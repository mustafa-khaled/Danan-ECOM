import { describe, expect, it } from "vitest";
import { formatAdminDate, formatPrice } from "./format";

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

describe("formatAdminDate", () => {
  it("returns empty string for missing values", () => {
    expect(formatAdminDate(null)).toBe("");
    expect(formatAdminDate(undefined)).toBe("");
  });

  it("formats a date in English", () => {
    expect(formatAdminDate("2026-01-12T00:00:00.000Z", "en")).toMatch(/Jan 2026/);
  });
});
