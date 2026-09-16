import { describe, expect, it } from "vitest";
import { pickLocalized } from "./pick-localized";

describe("pickLocalized", () => {
  it("returns Arabic when locale is ar and Arabic is present", () => {
    expect(pickLocalized("ar", "House", "البيت")).toBe("البيت");
  });

  it("falls back to English when Arabic is missing", () => {
    expect(pickLocalized("ar", "House", null)).toBe("House");
    expect(pickLocalized("ar", "House", "")).toBe("House");
  });

  it("returns English when locale is en", () => {
    expect(pickLocalized("en", "House", "البيت")).toBe("House");
  });
});
