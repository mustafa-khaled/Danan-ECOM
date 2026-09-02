"use client";

import { forwardRef, useImperativeHandle } from "react";
import {
  Currencies,
  Direction,
  Edges,
  Locale,
  TapCard,
  Theme,
  tokenize,
} from "@tap-payments/card-sdk";
import { TAP_MERCHANT_ID, TAP_PUBLIC_KEY } from "@/shared/lib/constants";

export interface TapCardElementHandle {
  /** Triggers tokenization of the currently entered card; result arrives via onSuccess/onError. */
  tokenize: () => void;
}

interface TapCardElementProps {
  amount: number;
  currency: string;
  locale: "ar" | "en";
  onSuccess: (tokenId: string) => void;
  onError: (message: string) => void;
  onReady?: () => void;
  /** Shown when no Tap public key is configured. */
  configError: string;
}

const CURRENCY_MAP: Partial<Record<string, Currencies>> = {
  SAR: Currencies.SAR,
  AED: Currencies.AED,
  USD: Currencies.USD,
  EUR: Currencies.EUR,
  GBP: Currencies.GBP,
  KWD: Currencies.KWD,
  BHD: Currencies.BHD,
  OMR: Currencies.OMR,
  QAR: Currencies.QAR,
  EGP: Currencies.EGP,
};

/**
 * Wraps Tap Payments' Web Card SDK v2 (`@tap-payments/card-sdk`). The card
 * element runs entirely inside a Tap-hosted iframe — raw card data never
 * touches our frontend or backend, only the resulting `tok_...` token does.
 */
export const TapCardElement = forwardRef<TapCardElementHandle, TapCardElementProps>(
  function TapCardElement(
    { amount, currency, locale, onSuccess, onError, onReady, configError },
    ref,
  ) {
    useImperativeHandle(ref, () => ({
      tokenize: () => tokenize(),
    }));

    // Without a public key the SDK mounts an empty iframe and tokenization
    // fails silently, so surface the misconfiguration instead.
    if (!TAP_PUBLIC_KEY) {
      return (
        <p role="alert" className="text-sm text-ds-error">
          {configError}
        </p>
      );
    }

    return (
      <TapCard
        publicKey={TAP_PUBLIC_KEY}
        // Optional per Tap's SDK reference — omitted entirely when unset,
        // since passing an empty id makes the SDK reject the configuration.
        {...(TAP_MERCHANT_ID ? { merchant: { id: TAP_MERCHANT_ID } } : {})}
        transaction={{
          amount,
          currency: CURRENCY_MAP[currency.toUpperCase()] ?? Currencies.SAR,
        }}
        acceptance={{
          supportedBrands: ["VISA", "MASTERCARD", "MADA", "AMEX"],
          supportedCards: ["CREDIT", "DEBIT"],
        }}
        fields={{ cardHolder: true }}
        addons={{ displayPaymentBrands: true, loader: true, saveCard: false }}
        interface={{
          locale: locale === "ar" ? Locale.AR : Locale.EN,
          theme: Theme.DARK,
          edges: Edges.CURVED,
          direction: locale === "ar" ? Direction.RTL : Direction.LTR,
        }}
        onReady={onReady}
        onError={(data: unknown) => {
          const message =
            typeof data === "object" && data && "message" in data
              ? String((data as { message?: unknown }).message)
              : "Card was declined. Please check your details and try again.";
          onError(message);
        }}
        onSuccess={(data: unknown) => {
          const tokenId =
            typeof data === "object" && data && "id" in data
              ? (data as { id?: unknown }).id
              : undefined;
          if (typeof tokenId === "string") {
            onSuccess(tokenId);
          } else {
            onError("Payment could not be confirmed. Please try again.");
          }
        }}
      />
    );
  },
);
