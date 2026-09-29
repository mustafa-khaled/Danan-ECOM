import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
import { AdminProvider } from "@/shared/providers/admin-context";
import type { AdminRole } from "@/shared/lib/admin-nav";

let pathname = "/admin/overview";
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

import { AdminAccessGuard } from "./admin-access-guard";

function renderGuard(role: AdminRole, path: string) {
  pathname = path;
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <AdminProvider admin={{ displayName: "Admin", role }}>
        <AdminAccessGuard>
          <p>section content</p>
        </AdminAccessGuard>
      </AdminProvider>
    </NextIntlClientProvider>,
  );
}

const content = () => screen.queryByText("section content");
const denied = () => screen.queryByText(en.admin.errors.accessDeniedTitle);

describe("AdminAccessGuard", () => {
  it("renders the section when the role may open it", () => {
    renderGuard("VIEWER", "/admin/analytics");

    expect(content()).not.toBeNull();
    expect(denied()).toBeNull();
  });

  it("denies a section the role cannot open", () => {
    renderGuard("VIEWER", "/admin/settings");

    expect(content()).toBeNull();
    expect(denied()).not.toBeNull();
  });

  // Nested routes inherit their section's rule rather than falling through.
  it("denies a nested route under a restricted section", () => {
    renderGuard("OPERATIONS", "/admin/collections/abc-123/access");

    expect(content()).toBeNull();
    expect(denied()).not.toBeNull();
  });

  it.each(["/admin/members/new", "/admin/members/abc-123/edit"])(
    "denies %s to a read-only role",
    (path) => {
      renderGuard("VIEWER", path);

      expect(content()).toBeNull();
      expect(denied()).not.toBeNull();
    },
  );

  it("still allows read-only roles onto the detail page", () => {
    renderGuard("VIEWER", "/admin/members/abc-123");

    expect(content()).not.toBeNull();
  });

  it("lets a writing role onto create screens", () => {
    renderGuard("OPERATIONS", "/admin/members/new");

    expect(content()).not.toBeNull();
  });
});
