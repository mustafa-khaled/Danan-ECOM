import { describe, expect, it } from "vitest";
import { parseShippingAddressFromFormData } from "@/features/checkout/schemas/shipping-address";

describe("parseShippingAddressFromFormData", () => {
  it("parses valid shipping address", () => {
    const form = new FormData();
    form.set("fullName", "Layla Al-Rashid");
    form.set("line1", "King Fahd Road 123");
    form.set("city", "Riyadh");
    form.set("region", "Riyadh");
    form.set("country", "SA");
    form.set("postalCode", "12345");
    form.set("phone", "+966501234567");

    const result = parseShippingAddressFromFormData(form);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBe("Layla Al-Rashid");
      expect(result.data.country).toBe("SA");
    }
  });

  it("returns field errors for invalid input", () => {
    const form = new FormData();
    form.set("fullName", "");
    form.set("line1", "");
    form.set("city", "");
    form.set("region", "");
    form.set("country", "SA");
    form.set("postalCode", "");
    form.set("phone", "invalid-phone!");

    const result = parseShippingAddressFromFormData(form);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.fullName).toBeDefined();
      expect(result.errors.phone).toBeDefined();
    }
  });
});
