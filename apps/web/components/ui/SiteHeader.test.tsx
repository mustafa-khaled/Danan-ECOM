import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";

vi.mock("next/navigation", () => ({
  usePathname: () => "/beta/home",
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: ({
    alt,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    priority,
    ...props
  }: {
    alt: string;
    src: string;
    priority?: boolean;
    [key: string]: unknown;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

vi.mock("@/features/auth", () => ({
  useClientLogout: () => ({ logout: vi.fn(), isPending: false }),
}));

vi.mock("@/features/profile", () => ({
  useUpdateProfile: () => ({ updateProfile: vi.fn(), isPending: false }),
}));

import { SiteHeader } from "@/components/ui/SiteHeader";
import { ClientProvider } from "@/shared/providers/client-context";

const contextValue = {
  clientId: "client-1",
  displayName: "Ahmed",
  visibilityGroups: ["DEFAULT"],
};

function renderHeader() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ClientProvider value={contextValue}>
        <SiteHeader />
      </ClientProvider>
    </NextIntlClientProvider>,
  );
}

describe("SiteHeader", () => {
  it("renders nav items and greeting", () => {
    renderHeader();

    expect(screen.getAllByText(/Ahmed/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Collections").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Wardrobe").length).toBeGreaterThan(0);
  });

  it("renders language select with options", () => {
    renderHeader();

    const languageSelects = screen.getAllByRole("combobox", { name: "Switch language" });
    expect(languageSelects.length).toBeGreaterThan(0);
    expect(languageSelects[0]).toHaveTextContent("EN");
  });

  it("opens mobile side menu on burger button click with links and utility icons", () => {
    renderHeader();

    const burgerBtn = screen.getByRole("button", { name: "Toggle navigation menu" });
    expect(burgerBtn).toBeInTheDocument();

    // Click to open side menu
    fireEvent.click(burgerBtn);

    // Mobile nav section exists
    const mobileNav = screen.getByRole("navigation", { name: "Mobile Navigation" });
    expect(mobileNav).toBeInTheDocument();

    // Side menu close button exists
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();

    // Language selector in mobile drawer
    const languageSelects = screen.getAllByRole("combobox", { name: "Switch language" });
    expect(languageSelects.length).toBe(2);
  });
});

