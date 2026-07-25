import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";

vi.mock("next/navigation", () => ({
  usePathname: () => "/beta/home",
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/features/auth", () => ({
  useClientLogout: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/features/profile", () => ({
  useUpdateProfile: () => ({ mutate: vi.fn(), isPending: false }),
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

  it("renders language switcher", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <SiteHeader displayName="Ahmed" />
      </NextIntlClientProvider>,
    );

    expect(screen.getAllByText("AR").length).toBeGreaterThan(0);
  });
});
