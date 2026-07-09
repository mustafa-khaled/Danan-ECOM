"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { ShippingAddress } from "@/types";
import { GoldDivider, LuxuryButton } from "@/components/ui";
import { formatPrice } from "@/shared/utils/format";
import { useCheckout } from "@/features/checkout";

interface CheckoutFormProps {
  total: number;
  currency: string;
}

const PAYMENT_MODE = process.env.NEXT_PUBLIC_PAYMENT_MODE ?? "mock";
const VAT_RATE = Number(process.env.NEXT_PUBLIC_VAT_RATE ?? "0.15");

export function CheckoutForm({ total, currency }: CheckoutFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const {
    mutateAsync: checkout,
    isPending,
    error,
  } = useCheckout();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    if (PAYMENT_MODE !== "mock") {
      return;
    }

    const form = new FormData(event.currentTarget);

    const shippingAddress: ShippingAddress = {
      fullName: String(form.get("fullName") ?? ""),
      line1: String(form.get("line1") ?? ""),
      line2: String(form.get("line2") ?? "") || undefined,
      city: String(form.get("city") ?? ""),
      region: String(form.get("region") ?? ""),
      country: String(form.get("country") ?? "SA"),
      postalCode: String(form.get("postalCode") ?? ""),
      phone: String(form.get("phone") ?? ""),
    };

    try {
      const result = await checkout({
        shippingAddress,
        paymentMethod: "CARD",
        paymentToken: "mock_token_success",
      });
      router.push(`/beta/orders/${result.orderId}`);
    } catch {
      /* error is rendered via the mutation's `error` state */
    }
  }

  const vat = total * VAT_RATE;
  const grandTotal = total + vat;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
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
        <section className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="font-display text-xl text-[var(--color-ivory)]">Shipping Address</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" name="fullName" required className="sm:col-span-2" />
            <Field label="Phone" name="phone" required />
            <Field label="Address Line 1" name="line1" required className="sm:col-span-2" />
            <Field label="Address Line 2" name="line2" className="sm:col-span-2" />
            <Field label="City" name="city" required />
            <Field label="Region" name="region" required />
            <Field label="Postal Code" name="postalCode" required />
            <Field label="Country" name="country" defaultValue="SA" required />
          </div>
          {PAYMENT_MODE === "mock" ? (
            <p className="mt-6 text-xs text-[var(--color-ivory-muted)]">
              Payment is processed securely via mock gateway for this preview.
            </p>
          ) : null}
        </section>
      )}

      {error ? (
        <p role="alert" className="text-sm text-[var(--color-ruby)]">
          {error instanceof Error ? error.message : "Checkout failed"}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {step === 2 ? (
          <LuxuryButton type="button" variant="ghost" onClick={() => setStep(1)}>
            Back
          </LuxuryButton>
        ) : null}
        <LuxuryButton type="submit" loading={isPending}>
          {step === 1 ? "Confirm and Continue" : "Complete Purchase"}
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
}: {
  label: string;
  name: string;
  required?: boolean;
  className?: string;
  defaultValue?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]">
        {label}
      </span>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="min-h-11 w-full rounded-[var(--radius-item)] border border-[var(--color-border)] bg-[var(--color-void)] px-4 text-[var(--color-ivory)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
      />
    </label>
  );
}
