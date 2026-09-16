import { describe, expect, it } from "vitest";
import { getAdminNavItems } from "./admin-nav";

describe("getAdminNavItems", () => {
  it("shows all 9 sections for SUPER_ADMIN", () => {
    const items = getAdminNavItems("SUPER_ADMIN");
    expect(items).toHaveLength(9);
    expect(items.some((item) => item.href === "/admin/designs")).toBe(false);
  });

  it("shows 8 sections for STAFF (no settings)", () => {
    const items = getAdminNavItems("STAFF");
    expect(items).toHaveLength(8);
    expect(items.some((item) => item.href === "/admin/settings")).toBe(false);
  });

  it("hides collections, operations, and settings from VIEWER", () => {
    const items = getAdminNavItems("VIEWER");
    expect(items.some((item) => item.href === "/admin/collections")).toBe(false);
    expect(items.some((item) => item.href === "/admin/operations")).toBe(false);
    expect(items.some((item) => item.href === "/admin/settings")).toBe(false);
  });

  it("returns correct hrefs — no stale paths", () => {
    const allHrefs = getAdminNavItems("SUPER_ADMIN").map((item) => item.href);
    expect(allHrefs).not.toContain("/admin/clients");
    expect(allHrefs).not.toContain("/admin/certificates");
    expect(allHrefs).not.toContain("/admin/orders");
    expect(allHrefs).not.toContain("/admin/transfers");
    expect(allHrefs).not.toContain("/admin/verification-logs");
    expect(allHrefs).toContain("/admin/members");
    expect(allHrefs).toContain("/admin/payments");
    expect(allHrefs).toContain("/admin/operations");
  });
});
