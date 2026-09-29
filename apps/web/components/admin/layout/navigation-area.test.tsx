import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
import { ADMIN_NAV_ITEMS, type AdminRole } from "@/shared/lib/admin-nav";
import { AdminProvider } from "@/shared/providers/admin-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/overview",
}));

import NavigationArea from "./navigation-area";

function renderNav(role: AdminRole = "SUPER_ADMIN") {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <AdminProvider admin={{ displayName: "Admin", role }}>
        <NavigationArea setMobileOpen={() => {}} />
      </AdminProvider>
    </NextIntlClientProvider>,
  );
}

function renderedHrefs(): string[] {
  return screen
    .getAllByRole("link")
    .map((link) => link.getAttribute("href") ?? "");
}

describe("NavigationArea", () => {
  // Regression: these rows used to wrap a <button> inside the <Link>, which
  // swallowed the navigation.
  it.each([
    ["Analytics", "/admin/analytics"],
    ["Members", "/admin/members"],
    ["Payments", "/admin/payments"],
    ["Settings", "/admin/settings"],
  ])("renders %s as a plain link to %s", (label, href) => {
    renderNav();

    const link = screen.getByRole("link", { name: label });

    expect(link).toHaveAttribute("href", href);
    expect(link.querySelector("button")).toBeNull();
  });

  it("shows every section to a SUPER_ADMIN", () => {
    renderNav("SUPER_ADMIN");

    for (const item of ADMIN_NAV_ITEMS) {
      expect(renderedHrefs()).toContain(item.href);
    }
  });

  it("hides sections a VIEWER cannot open", () => {
    renderNav("VIEWER");
    const hrefs = renderedHrefs();

    expect(hrefs).not.toContain("/admin/settings");
    expect(hrefs).not.toContain("/admin/operations");
    expect(hrefs).not.toContain("/admin/collections");
    // Still needs the sections a VIEWER is allowed to read.
    expect(hrefs).toContain("/admin/overview");
    expect(hrefs).toContain("/admin/analytics");
  });

  it("hides Collections from OPERATIONS but keeps Operations", () => {
    renderNav("OPERATIONS");
    const hrefs = renderedHrefs();

    expect(hrefs).not.toContain("/admin/collections");
    expect(hrefs).not.toContain("/admin/analytics");
    expect(hrefs).toContain("/admin/operations");
  });

  // An href missing from ADMIN_NAV_ITEMS is treated as ungated, so it would be
  // shown to every role including VIEWER.
  it("has a role rule for every sidebar row", () => {
    renderNav("SUPER_ADMIN");
    const mapped = new Set(ADMIN_NAV_ITEMS.map((item) => item.href));

    for (const href of renderedHrefs()) {
      expect(mapped, `${href} has no entry in ADMIN_NAV_ITEMS`).toContain(href);
    }
  });
});
