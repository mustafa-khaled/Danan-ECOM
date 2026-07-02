"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LuxuryButton } from "@dadan/ui";
import { ApiError, validateHouseKey } from "../../lib/api";

export default function AccessGatePage() {
  const router = useRouter();
  const [houseKey, setHouseKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await validateHouseKey(houseKey);
      router.push("/beta/home");
      router.refresh();
    } catch (err) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      if (err instanceof ApiError && err.status === 429) {
        setError("Please wait before trying again");
      } else if (nextAttempts >= 3) {
        setError("Please wait before trying again");
      } else {
        setError("Access denied");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div lang="ar" dir="rtl" className="client-shell min-h-dvh">
      <div className="access-gate-bg relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden="true" className="access-gate-grid pointer-events-none absolute inset-0 opacity-70" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 text-center">
          <p className="font-display text-4xl tracking-[0.14em] uppercase text-[var(--color-ivory)] sm:text-5xl">
            DADAN
          </p>
          <p className="mt-2 text-xs tracking-[0.28em] uppercase text-[var(--color-gold-light)]">
            Dijital
          </p>
          <p className="font-arabic mt-6 text-base text-[var(--color-ivory-muted)]">
            أدخل مفتاحك الخاص
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-luxury)]"
        >
          <label htmlFor="house-key" className="sr-only">
            House Key
          </label>
          <input
            id="house-key"
            name="houseKey"
            type="password"
            autoComplete="off"
            required
            value={houseKey}
            onChange={(event) => setHouseKey(event.target.value)}
            placeholder="House Key"
            className="min-h-11 w-full rounded-[var(--radius-item)] border border-[var(--color-border)] bg-[var(--color-void)] px-4 text-[var(--color-ivory)] placeholder:text-[var(--color-ivory-muted)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
          />

          {error ? (
            <p role="alert" className="mt-4 text-sm text-[var(--color-ruby)]">
              {error}
            </p>
          ) : null}

          <LuxuryButton
            type="submit"
            className="mt-6 w-full"
            loading={loading}
            disabled={attempts >= 3 && !loading}
          >
            دخول
          </LuxuryButton>
        </form>
      </div>
    </div>
    </div>
  );
}
