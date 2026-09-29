import { describe, expect, it } from "vitest";
import { formatAdminDate, formatPrice } from "./format";

describe("formatAdminDate", () => {
  // 21:30 UTC is already the next day in Riyadh (GMT+3). Without a pinned zone
  // this rendered as 02 Oct for admins west of GMT+3.
  it("renders the Riyadh calendar day, not the viewer's", () => {
    expect(formatAdminDate("2025-10-02T21:30:00.000Z")).toBe("03 Oct 2025");
  });

  it("returns an empty string for missing or unparseable values", () => {
    expect(formatAdminDate(null)).toBe("");
    expect(formatAdminDate("not-a-date")).toBe("");
  });
});

describe("formatPrice", () => {
  it("formats SAR amounts without stray decimals", () => {
    expect(formatPrice(1500, "SAR", "en")).toContain("1,500");
    expect(formatPrice(1500, "SAR", "en")).not.toContain(".00");
  });

  it("includes a currency marker in both locales", () => {
    expect(formatPrice(500, "SAR", "en")).toMatch(/SAR/);
    expect(formatPrice(500, "SAR", "ar")).toMatch(/ر\.س/);
  });
});
