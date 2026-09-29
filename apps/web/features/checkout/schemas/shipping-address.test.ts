import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import {
  parseShippingAddressFromFormData,
  validateShippingAddressField,
} from "@/features/checkout/schemas/shipping-address";

function validForm(overrides: Record<string, string> = {}) {
  const form = new FormData();
  form.set("fullName", "Layla Al-Rashid");
  form.set("line1", "King Fahd Road 123");
  form.set("city", "Riyadh");
  form.set("region", "Riyadh");
  form.set("country", "SA");
  form.set("postalCode", "12345");
  form.set("phone", "+966501234567");
  for (const [key, value] of Object.entries(overrides)) form.set(key, value);
  return form;
}

describe("parseShippingAddressFromFormData", () => {
  it("parses valid shipping address", () => {
    const result = parseShippingAddressFromFormData(validForm());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBe("Layla Al-Rashid");
      expect(result.data.country).toBe("SA");
    }
  });

  it("returns message keys rather than English prose", () => {
    const result = parseShippingAddressFromFormData(
      validForm({ fullName: "", phone: "invalid-phone!" }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.fullName).toBe("required");
      expect(result.errors.phone).toBe("phoneInvalid");
    }
  });

  it("flags a country that is not a 2-letter code", () => {
    const result = parseShippingAddressFromFormData(validForm({ country: "Saudi" }));

    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.country).toBe("countryCode");
  });
});

describe("validateShippingAddressField", () => {
  it("accepts a valid single field", () => {
    expect(validateShippingAddressField("city", "Jeddah")).toBeUndefined();
  });

  it("reports the same keys the full parse reports", () => {
    expect(validateShippingAddressField("fullName", "")).toBe("required");
    expect(validateShippingAddressField("phone", "abc")).toBe("phoneInvalid");
    expect(validateShippingAddressField("postalCode", "1".repeat(21))).toBe("tooLong");
  });

  it("treats a blank optional line2 as valid", () => {
    expect(validateShippingAddressField("line2", "")).toBeUndefined();
  });
});

describe("validation message keys", () => {
  // The form renders these through t(`validation.${key}`), so a key with no
  // translation would surface as raw text to the shopper.
  it("every key the schema can emit has English copy", () => {
    const keys = [
      validateShippingAddressField("fullName", ""),
      validateShippingAddressField("phone", "abc"),
      validateShippingAddressField("postalCode", "1".repeat(21)),
      validateShippingAddressField("country", "Saudi"),
      "invalid",
    ];

    for (const key of keys) {
      expect(key).toBeDefined();
      expect(en.checkout.validation).toHaveProperty(key as string);
    }
  });
});
