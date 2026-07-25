import { describe, expect, it } from "vitest";
import { calculateTotal, calculateVat, VAT_RATE } from "./pricing";

describe("pricing", () => {
  it("uses configured VAT rate", () => {
    expect(VAT_RATE).toBeGreaterThan(0);
  });

  it("calculates VAT from subtotal", () => {
    expect(calculateVat(100)).toBe(100 * VAT_RATE);
  });

  it("calculates total with VAT", () => {
    expect(calculateTotal(100)).toBe(100 + 100 * VAT_RATE);
  });
});
