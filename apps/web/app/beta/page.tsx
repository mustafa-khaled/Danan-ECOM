"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/shared/lib/send-request";
import { validateRedirectPath } from "@/shared/lib/validate-redirect-path";
import { useValidateKey } from "@/features/auth";
import { AccessGateHeader } from "@/components/ui/WelcomeModal";
import { SplitHeroLayout } from "@/components/ui/SplitHeroLayout";

export default function AccessGatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("accessGate");
  const [houseKey, setHouseKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const { validateKey, isPending } = useValidateKey();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await validateKey(houseKey);
      const next = validateRedirectPath(searchParams.get("next"));
      router.push(next);
      router.refresh();
    } catch (err) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      if (err instanceof ApiError && err.status === 429) {
        setError(t("rateLimited"));
      } else if (nextAttempts >= 3) {
        setError(t("rateLimited"));
      } else {
        setError(t("accessDenied"));
      }
    }
  }

  return (
    <SplitHeroLayout
      imageSrc="/assets/coming-soon.png"
      imageAlt="DADAN campaign"
    >
      <AccessGateHeader />

      <div className="relative mb-8 aspect-4/3 w-full overflow-hidden md:hidden">
        <Image
          src="/assets/coming-soon.png"
          alt="DADAN campaign"
          fill
          priority
          quality={85}
          className="object-cover object-top"
        />
      </div>

      <main className="flex max-w-110 flex-1 flex-col justify-center">
        <h1 className="mb-8 font-english text-[2.5rem] font-normal leading-tight tracking-tight text-(--color-text)">
          {t("title")}
        </h1>

        <h2 className="mb-2 text-[1.0625rem] font-semibold leading-snug text-(--color-text)">
          {t("welcome")}
        </h2>

        <p className="mb-10 text-[0.9375rem] font-normal leading-relaxed text-(--color-text-muted)">
          {t("description")}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <label
            htmlFor="house-key"
            className="mb-2.5 text-sm font-semibold text-(--color-text)"
          >
            {t("houseKey")}
          </label>
          <input
            id="house-key"
            name="houseKey"
            type="password"
            autoComplete="off"
            required
            value={houseKey}
            onChange={(event) => setHouseKey(event.target.value)}
            placeholder={t("houseKeyPlaceholder")}
            className="w-full rounded-sm border border-border bg-white px-4 py-3 text-sm text-(--color-text) outline-none transition-all placeholder:text-(--color-text-muted) focus:border-[#999] focus:ring-[3px] focus:ring-black/4"
          />

          {error ? (
            <p role="alert" className="mt-3 text-[0.8125rem] text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending || (attempts >= 3 && !isPending)}
            className="mt-6 inline-flex min-h-11 items-center justify-center bg-(--color-accent) px-6 text-sm tracking-widest uppercase text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? (
              <span className="inline-block size-4.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              t("houseKey")
            )}
          </button>

          <a
            href="mailto:admin@dadan.sa?subject=DADAN%20House%20Key%20Assistance"
            className="mt-4 text-[0.8125rem] text-(--color-text-muted) underline underline-offset-[3px] transition-colors hover:text-(--color-text)"
          >
            {t("assistance")}
          </a>
        </form>
      </main>
    </SplitHeroLayout>
  );
}
