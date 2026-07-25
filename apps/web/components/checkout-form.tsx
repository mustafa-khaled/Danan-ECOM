"use client";

import dynamic from "next/dynamic";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { FormEvent, Suspense, useRef, useState } from "react";
import { GoldDivider, LuxuryButton } from "@/components/ui";
import { formatPrice } from "@/shared/utils/format";
import { PAYMENT_MODE } from "@/shared/lib/constants";
import { VAT_RATE } from "@/shared/lib/pricing";
import { useCheckout, type TapCardElementHandle } from "@/features/checkout";
import type { ShippingAddress } from "@/features/checkout/types";
import { parseShippingAddressFromFormData } from "@/features/checkout/schemas/shipping-address";

const TapCardElement = dynamic(
  () =>
    import("@/features/checkout/components/tap-card-element").then(
      (mod) => ({ default: mod.TapCardElement }),
    ),
  { ssr: false },
);

interface CheckoutFormProps {
  total: number;
  currency: string;
}

export function CheckoutForm({ total, currency }: CheckoutFormProps) {
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

  const vat = total * VAT_RATE;
  const grandTotal = total + vat;

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
        <section className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="font-display text-xl text-[var(--color-ivory)]">Order Review</h2>
          <p className="mt-2 text-sm text-[var(--color-ivory-muted)]">
            Confirm your selection before entering shipping details.
          </p>
          <GoldDivider className="my-6" />
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--color-ivory-muted)]">Subtotal</dt>
              <dd>{formatPrice(total, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-ivory-muted)]">VAT ({Math.round(VAT_RATE * 100)}%)</dt>
              <dd>{formatPrice(vat, currency)}</dd>
            </div>
            <div className="flex justify-between font-display text-lg text-[var(--color-gold-light)]">
              <dt>Total</dt>
              <dd>{formatPrice(grandTotal, currency)}</dd>
            </div>
          </dl>
        </section>
      ) : (
        <>
          <section className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="font-display text-xl text-[var(--color-ivory)]">Shipping Address</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field
                label="Full Name"
                name="fullName"
                required
                className="sm:col-span-2"
                error={fieldErrors.fullName}
              />
              <Field label="Phone" name="phone" required error={fieldErrors.phone} />
              <Field
                label="Address Line 1"
                name="line1"
                required
                className="sm:col-span-2"
                error={fieldErrors.line1}
              />
              <Field
                label="Address Line 2"
                name="line2"
                className="sm:col-span-2"
                error={fieldErrors.line2}
              />
              <Field label="City" name="city" required error={fieldErrors.city} />
              <Field label="Region" name="region" required error={fieldErrors.region} />
              <Field label="Postal Code" name="postalCode" required error={fieldErrors.postalCode} />
              <Field label="Country" name="country" defaultValue="SA" required error={fieldErrors.country} />
            </div>
          </section>

          <section className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="font-display text-xl text-[var(--color-ivory)]">Payment</h2>
            {isLivePayment ? (
              <div className="mt-6">
                <Suspense fallback={<div className="text-sm text-[var(--color-ivory-muted)]">Loading payment form...</div>}>
                  <TapCardElement
                    ref={tapCardRef}
                    amount={grandTotal}
                    currency={currency}
                    locale={locale}
                    onSuccess={handleTokenSuccess}
                    onError={handleTokenError}
                  />
                </Suspense>
                {cardError ? (
                  <p role="alert" className="mt-3 text-sm text-[var(--color-ruby)]">
                    {cardError}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-6 text-xs text-[var(--color-ivory-muted)]">
                Payment is processed securely via mock gateway for this preview.
              </p>
            )}
          </section>
        </>
      )}

      {error ? (
        <p role="alert" className="text-sm text-[var(--color-ruby)]">
          {error instanceof Error ? error.message : "Checkout failed"}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {step === 2 ? (
          <LuxuryButton
            type="button"
            variant="ghost"
            onClick={() => setStep(1)}
            disabled={isSubmitting}
          >
            Back
          </LuxuryButton>
        ) : null}
        <LuxuryButton type="submit" loading={isSubmitting}>
          {step === 1 ? "Confirm and Continue" : isSubmitting ? "Processing…" : "Complete Purchase"}
        </LuxuryButton>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  className = "",
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  required?: boolean;
  className?: string;
  defaultValue?: string;
  error?: string;
}) {
  const fieldId = `checkout-${name}`;

  return (
    <label className={`block ${className}`} htmlFor={fieldId}>
      <span className="mb-2 block text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]">
        {label}
      </span>
      <input
        id={fieldId}
        name={name}
        required={required}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className="min-h-11 w-full rounded-[var(--radius-item)] border border-[var(--color-border)] bg-[var(--color-void)] px-4 text-[var(--color-ivory)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
      />
      {error ? (
        <p id={`${fieldId}-error`} role="alert" className="mt-1 text-xs text-[var(--color-ruby)]">
          {error}
        </p>
      ) : null}
    </label>
  );
}
