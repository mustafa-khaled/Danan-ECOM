"use client";

import dynamic from "next/dynamic";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { FormEvent, Suspense, useRef, useState } from "react";
import { Button, Input } from "@/components/ui";
import { formatPrice } from "@/shared/utils/format";
import { PAYMENT_MODE } from "@/shared/lib/constants";
import { useCheckout, type TapCardElementHandle } from "@/features/checkout";
import type { ShippingAddress } from "@/features/checkout/types";
import { parseShippingAddressFromFormData } from "@/features/checkout/schemas/shipping-address";
import type { CartSummary } from "@/features/cart";

const TapCardElement = dynamic(
  () =>
    import("@/features/checkout/components/tap-card-element").then(
      (mod) => ({ default: mod.TapCardElement }),
    ),
  { ssr: false },
);

interface CheckoutFormProps {
  summary: CartSummary;
}

export function CheckoutForm({ summary }: CheckoutFormProps) {
  const router = useRouter();
  const locale = useLocale() as "ar" | "en";
  const [step, setStep] = useState<1 | 2>(1);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [cardError, setCardError] = useState<string | null>(null);
  const [isTokenizing, setIsTokenizing] = useState(false);
  const shippingAddressRef = useRef<ShippingAddress | null>(null);
  const tapCardRef = useRef<TapCardElementHandle>(null);
  const { checkout, isPending, error } = useCheckout();

  const isLivePayment = PAYMENT_MODE === "live";

  async function completeCheckout(shippingAddress: ShippingAddress, paymentToken: string) {
    try {
      const result = await checkout({
        shippingAddress,
        paymentMethod: "CARD",
        paymentToken,
      });
      router.push(`/beta/orders/${result.orderId}`);
    } catch {
      /* error is rendered via the mutation's `error` state */
    } finally {
      setIsTokenizing(false);
    }
  }

  function handleTokenSuccess(tokenId: string) {
    const shippingAddress = shippingAddressRef.current;
    if (!shippingAddress) {
      setIsTokenizing(false);
      return;
    }
    void completeCheckout(shippingAddress, tokenId);
  }

  function handleTokenError(message: string) {
    setCardError(message);
    setIsTokenizing(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setCardError(null);

    if (step === 1) {
      setStep(2);
      return;
    }

    const form = new FormData(event.currentTarget);
    const parsed = parseShippingAddressFromFormData(form);

    if (!parsed.success) {
      setFieldErrors(parsed.errors);
      return;
    }

    if (isLivePayment) {
      shippingAddressRef.current = parsed.data;
      setIsTokenizing(true);
      tapCardRef.current?.tokenize();
      return;
    }

    await completeCheckout(parsed.data, "mock_token_success");
  }

  const isSubmitting = isPending || isTokenizing;

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {step === 1 ? (
        <section className="rounded-(--radius-md) border border-ds-border bg-ds-background p-6 shadow-sm">
          <h2 className="font-heading text-xl text-ds-text">Order Review</h2>
          <p className="mt-2 text-sm text-ds-text-secondary">
            Confirm your selection before entering shipping details.
          </p>
          <div className="my-6 border-t border-ds-border" />
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ds-text-secondary">Subtotal</dt>
              <dd className="font-medium text-ds-text">{formatPrice(summary.subtotal, summary.currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ds-text-secondary">VAT ({Math.round(summary.vatRate * 100)}%)</dt>
              <dd className="font-medium text-ds-text">{formatPrice(summary.vatAmount, summary.currency)}</dd>
            </div>
            <div className="flex justify-between font-heading text-lg font-bold text-ds-text pt-2 border-t border-ds-border-light">
              <dt>Total</dt>
              <dd>{formatPrice(summary.total, summary.currency)}</dd>
            </div>
          </dl>
        </section>
      ) : (
        <>
          <section className="rounded-(--radius-md) border border-ds-border bg-ds-background p-6 shadow-sm">
            <h2 className="font-heading text-xl text-ds-text">Shipping Address</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Input
                label="Full Name"
                name="fullName"
                required
                className="sm:col-span-2"
                error={fieldErrors.fullName}
              />
              <Input label="Phone" name="phone" required error={fieldErrors.phone} />
              <Input
                label="Address Line 1"
                name="line1"
                required
                className="sm:col-span-2"
                error={fieldErrors.line1}
              />
              <Input
                label="Address Line 2"
                name="line2"
                className="sm:col-span-2"
                error={fieldErrors.line2}
              />
              <Input label="City" name="city" required error={fieldErrors.city} />
              <Input label="Region" name="region" required error={fieldErrors.region} />
              <Input label="Postal Code" name="postalCode" required error={fieldErrors.postalCode} />
              <Input label="Country" name="country" defaultValue="SA" required error={fieldErrors.country} />
            </div>
          </section>

          <section className="rounded-(--radius-md) border border-ds-border bg-ds-background p-6 shadow-sm">
            <h2 className="font-heading text-xl text-ds-text">Payment</h2>
            {isLivePayment ? (
              <div className="mt-6">
                <Suspense fallback={<div className="text-sm text-ds-text-secondary">Loading payment form...</div>}>
                  <TapCardElement
                    ref={tapCardRef}
                    amount={summary.total}
                    currency={summary.currency}
                    locale={locale}
                    onSuccess={handleTokenSuccess}
                    onError={handleTokenError}
                  />
                </Suspense>
                {cardError ? (
                  <p role="alert" className="mt-3 text-sm text-ds-error">
                    {cardError}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-6 text-xs text-ds-text-secondary">
                Payment is processed securely via mock gateway for this preview.
              </p>
            )}
          </section>
        </>
      )}

      {error ? (
        <p role="alert" className="text-sm text-ds-error">
          {error instanceof Error ? error.message : "Checkout failed"}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {step === 2 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(1)}
            disabled={isSubmitting}
          >
            Back
          </Button>
        ) : null}
        <Button type="submit" loading={isSubmitting} variant="primary">
          {step === 1 ? "Confirm and Continue" : isSubmitting ? "Processing…" : "Complete Purchase"}
        </Button>
      </div>
    </form>
  );
}
