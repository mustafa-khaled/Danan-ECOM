import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import { ClientProvider } from "@/shared/providers/client-context";
import type { CartSummary } from "@/features/cart";

const mockReserve = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/features/checkout", () => ({
  useCheckout: () => ({ checkout: vi.fn(), isPending: false, error: null }),
  useReserveForCheckout: () => ({
    reserveForCheckout: mockReserve,
    isPending: false,
  }),
}));

import { CheckoutForm } from "./checkout-form";

const summary: CartSummary = {
  subtotal: 40000,
  vatRate: 0.15,
  vatAmount: 6000,
  total: 46000,
  currency: "SAR",
  itemCount: 1,
};

const catalogue = { en, ar };
type TestLocale = keyof typeof catalogue;

/**
 * Copy comes from the message catalogue rather than hardcoded strings, so the
 * Arabic case is the same walk as the English one.
 */
function copy(locale: TestLocale) {
  return catalogue[locale].checkout;
}

/** The address fields only exist on step 2, so every test submits step 1 first. */
async function gotoAddressStep(locale: TestLocale = "en") {
  const t = copy(locale);

  render(
    <NextIntlClientProvider locale={locale} messages={catalogue[locale]}>
      <ClientProvider
        value={{
          clientId: "client-1",
          displayName: "Layla Al-Rashid",
          classId: "class-1",
          classSlug: "gold",
        }}
      >
        <CheckoutForm summary={summary} />
      </ClientProvider>
    </NextIntlClientProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: t.confirmAndContinue }));
  await screen.findByText(t.shippingAddress);

  return t;
}

function submit(label: string) {
  fireEvent.click(screen.getByRole("button", { name: label }));
}

/**
 * Several fields render the same "required" copy, so text queries cannot tell
 * them apart. `Input` sets aria-invalid only while a field is in error state.
 */
function isFlagged(label: string): boolean {
  return screen.getByLabelText(label).getAttribute("aria-invalid") === "true";
}

describe("CheckoutForm address validation", () => {
  beforeEach(() => {
    mockReserve.mockReset().mockResolvedValue(undefined);
  });

  // The reported bug: the message survived until the next submit, so a shopper
  // who had already fixed the field kept staring at it.
  it("clears a field's required error as soon as the shopper types", async () => {
    const t = await gotoAddressStep();

    submit(t.completePurchase);
    await waitFor(() => expect(isFlagged(t.fullName)).toBe(true));

    fireEvent.change(screen.getByLabelText(t.fullName), {
      target: { value: "Layla Al-Rashid" },
    });

    expect(isFlagged(t.fullName)).toBe(false);
  });

  it("clears only the field that changed", async () => {
    const t = await gotoAddressStep();

    submit(t.completePurchase);
    await waitFor(() => expect(isFlagged(t.fullName)).toBe(true));
    expect(isFlagged(t.phone)).toBe(true);
    expect(isFlagged(t.city)).toBe(true);

    fireEvent.change(screen.getByLabelText(t.fullName), {
      target: { value: "Layla Al-Rashid" },
    });

    expect(isFlagged(t.fullName)).toBe(false);
    expect(isFlagged(t.phone)).toBe(true);
    expect(isFlagged(t.city)).toBe(true);
  });

  it("flags a badly formatted value on blur, before any submit", async () => {
    const t = await gotoAddressStep();
    const phone = screen.getByLabelText(t.phone);

    fireEvent.change(phone, { target: { value: "abc" } });
    fireEvent.blur(phone);

    await waitFor(() =>
      expect(screen.getByText(t.validation.phoneInvalid)).toBeInTheDocument(),
    );
  });

  // Deliberate: tabbing through the form should not nag about fields the
  // shopper has not filled yet. Submit still catches them.
  it("does not flag an untouched empty field on blur", async () => {
    const t = await gotoAddressStep();

    fireEvent.blur(screen.getByLabelText(t.city));

    expect(isFlagged(t.city)).toBe(false);
    expect(screen.queryByText(t.validation.required)).not.toBeInTheDocument();
  });

  it("drops address errors when stepping back to the review", async () => {
    const t = await gotoAddressStep();

    submit(t.completePurchase);
    await waitFor(() => expect(isFlagged(t.fullName)).toBe(true));

    fireEvent.click(screen.getByRole("button", { name: t.back }));
    await screen.findByText(t.orderReview);

    submit(t.confirmAndContinue);
    await screen.findByText(t.shippingAddress);

    expect(isFlagged(t.fullName)).toBe(false);
    expect(screen.queryByText(t.validation.required)).not.toBeInTheDocument();
  });

  // The review could not verify Arabic because the messages were hardcoded
  // English in the schema.
  it("renders validation messages in Arabic", async () => {
    const t = await gotoAddressStep("ar");

    submit(t.completePurchase);

    await waitFor(() =>
      expect(screen.getAllByText(t.validation.required).length).toBeGreaterThan(0),
    );
    expect(isFlagged(t.fullName)).toBe(true);
  });
});
