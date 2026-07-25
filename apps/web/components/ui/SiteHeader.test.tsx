import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";

vi.mock("next/navigation", () => ({
  usePathname: () => "/beta/home",
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/features/auth", () => ({
  useClientLogout: () => ({ logout: vi.fn(), isPending: false }),
}));

vi.mock("@/features/profile", () => ({
  useUpdateProfile: () => ({ updateProfile: vi.fn(), isPending: false }),
}));

import { SiteHeader } from "@/components/ui/SiteHeader";

describe("SiteHeader", () => {
  it("renders nav items and greeting", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <SiteHeader displayName="Ahmed" />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText(/Ahmed/)).toBeInTheDocument();
    expect(screen.getByText("Collections")).toBeInTheDocument();
    expect(screen.getByText("Wardrobe")).toBeInTheDocument();
  });

  it("renders language select with options", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <SiteHeader displayName="Ahmed" />
      </NextIntlClientProvider>,
    );

    const selects = screen.getAllByLabelText("Select language");
    expect(selects.length).toBeGreaterThan(0);
    expect(selects[0]).toHaveValue("en");
  });
});
