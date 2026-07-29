import { describe, expect, it } from "vitest";
import { getAdminNavItems } from "./admin-nav";

describe("getAdminNavItems", () => {
  it("shows all sections for SUPER_ADMIN and STAFF", () => {
    expect(getAdminNavItems("SUPER_ADMIN")).toHaveLength(7);
    expect(getAdminNavItems("STAFF")).toHaveLength(7);
  });

  it("hides transfers from VIEWER", () => {
    const items = getAdminNavItems("VIEWER");
    expect(items).toHaveLength(4);
    expect(items.some((item) => item.href === "/admin/transfers")).toBe(false);
  });
});
