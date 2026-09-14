import { describe, expect, it } from "vitest";
import { getAdminNavItems } from "./admin-nav";

describe("getAdminNavItems", () => {
  it("shows all sections for SUPER_ADMIN and STAFF", () => {
    expect(getAdminNavItems("SUPER_ADMIN")).toHaveLength(8);
    expect(getAdminNavItems("STAFF")).toHaveLength(8);
    expect(getAdminNavItems("SUPER_ADMIN").some((item) => item.href === "/admin/designs")).toBe(
      false,
    );
  });

  it("hides transfers and verification logs from VIEWER", () => {
    const items = getAdminNavItems("VIEWER");
    expect(items).toHaveLength(5);
    expect(items.some((item) => item.href === "/admin/transfers")).toBe(false);
    expect(items.some((item) => item.href === "/admin/verification-logs")).toBe(false);
  });
});
