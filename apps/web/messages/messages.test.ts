import { describe, expect, it } from "vitest";
import ar from "@/messages/ar.json";
import en from "@/messages/en.json";

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return flattenKeys(value as Record<string, unknown>, path);
    }
    return [path];
  });
}

describe("i18n messages", () => {
  it("ar.json keys match en.json keys", () => {
    const arKeys = flattenKeys(ar).sort();
    const enKeys = flattenKeys(en).sort();
    expect(arKeys).toEqual(enKeys);
  });
});
