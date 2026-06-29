import { hasVisibilityAccess } from "@dadan/utils";
import { VisibilityService } from "../src/visibility/visibility.service";

describe("hasVisibilityAccess", () => {
  it("grants access when the item has no visibility groups", () => {
    expect(hasVisibilityAccess(["standard"], [])).toBe(true);
  });

  it("denies access to admin-only items", () => {
    expect(hasVisibilityAccess(["vip", "inner-circle"], ["admin-only"])).toBe(false);
  });

  it("grants access when client and item groups intersect", () => {
    expect(hasVisibilityAccess(["vip"], ["VIP"])).toBe(true);
    expect(hasVisibilityAccess(["inner circle"], ["inner-circle"])).toBe(true);
  });

  it("denies access when groups do not intersect", () => {
    expect(hasVisibilityAccess(["standard"], ["vip", "inner-circle"])).toBe(false);
  });
});

describe("VisibilityService", () => {
  const service = new VisibilityService();

  it("filters collections by client visibility groups", () => {
    const items = [
      { id: "public", visibilityGroups: [] as string[] },
      { id: "vip-only", visibilityGroups: ["vip"] },
      { id: "admin-only", visibilityGroups: ["admin-only"] },
      { id: "inner", visibilityGroups: ["inner-circle"] },
    ];

    const filtered = service.filterByVisibility(items, ["vip"]);

    expect(filtered.map((item) => item.id)).toEqual(["public", "vip-only"]);
  });
});
